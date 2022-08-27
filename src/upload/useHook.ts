import { toRefs, ref, computed } from 'vue';
import { SizeLimitObj, TdUploadProps, UploadFile } from './type';
import { getFilesAndErrors, validateFile, upload, getTriggerTextField } from '../_common/js/upload/main';
import useVModel from '../hooks/useVModel';
import { useConfig } from '../hooks/useConfig';
import {
  HTMLInputEvent,
  InnerProgressContext,
  OnResponseErrorContext,
  SuccessContext,
} from '../_common/js/upload/types';
import { RemoveContext } from './single-file';

/**
 * 上传组件全部逻辑，方便脱离 UI，自定义 UI 组件
 */
export default function useUpload(props: TdUploadProps) {
  const { files, modelValue } = toRefs(props);
  const { global, t, classPrefix } = useConfig('upload');
  const [uploadValue, setUploadValue] = useVModel(files, modelValue, props.defaultFiles || [], props.onChange, 'files');
  // TODO: 可能存在多个请求，一个不够
  const xhrReq = ref<XMLHttpRequest>();
  const toUploadFiles = ref<UploadFile[]>([]);
  // 单文件场景：触发元素文本
  const triggerUploadText = computed(() => {
    const field = getTriggerTextField({
      multiple: props.multiple,
      status: uploadValue.value?.[0]?.status,
    });
    return global.value.triggerUploadText[field];
  });

  const onResponseError = (p: OnResponseErrorContext) => {
    if (!p) return;
    const { response, event, files } = p;
    props.onFail?.({
      e: event,
      file: files?.[0],
      currentFiles: files,
      response,
    });
  };

  const onResponseProgress = (p: InnerProgressContext) => {
    props.onProgress?.({
      e: p.event,
      file: p.file,
      currentFiles: p.files,
      percent: p.percent,
      type: p.type,
    });
  };

  // 只有多个上传请求同时触发时才需 onOneFileSuccess
  const onResponseSuccess = (p: SuccessContext) => {
    if (!props.multiple || props.uploadAllFilesInOneRequest) return;
    props.onOneFileSuccess?.({
      e: p.event,
      file: p.file,
      response: p.response,
    });
  };

  function getSizeLimitError(sizeLimitObj: SizeLimitObj) {
    const limit = sizeLimitObj;
    return limit.message
      ? t(limit.message, { sizeLimit: limit.size })
      : `${t(global.value.sizeLimitMessage, { sizeLimit: limit.size })} ${limit.unit}`;
  }

  function onFileChange(event: HTMLInputEvent) {
    if (props.disabled) return;
    const { files } = event.target;
    props.onSelectChange?.([...files]);
    validateFile({
      uploadValue: uploadValue.value,
      files: [...files],
      allowUploadDuplicateFile: props.allowUploadDuplicateFile,
      max: props.max,
      sizeLimit: props.sizeLimit,
      format: props.format,
      beforeUpload: props.beforeUpload,
      beforeAllFilesUpload: props.beforeAllFilesUpload,
    }).then((args) => {
      // 自定义全文件校验不通过
      if (args.validateResult?.type === 'BEFORE_ALL_FILES_UPLOAD') return;
      // 文件数量校验不通过
      if (args.lengthOverLimit) {
        props.onValidate?.({ type: 'FILES_OVER_LENGTH_LIMIT' });
      }
      // 文件数量校验
      if (args.fileValidateList instanceof Array) {
        const { firstError, toFiles } = getFilesAndErrors(args.fileValidateList, getSizeLimitError);
        toUploadFiles.value = toFiles;
        // 错误信息处理
        if (firstError) {
          props.onValidate?.({ type: 'FILE_OVER_SIZE_LIMIT' });
        }
        // 如果是自动上传
        if (props.autoUpload) {
          uploadFiles(toFiles);
        }
      }
    });
  }

  /**
   * 上传文件
   * 对外暴露方法，修改时需谨慎
   */
  function uploadFiles(toFiles?: UploadFile[]) {
    const files = toFiles || toUploadFiles.value;
    upload({
      uploadedFiles: uploadValue.value,
      toUploadFiles: files,
      multiple: props.multiple,
      isBatchUpload: props.isBatchUpload,
      uploadAllFilesInOneRequest: props.uploadAllFilesInOneRequest,
      action: props.action,
      useMockProgress: props.useMockProgress,
      requestMethod: props.requestMethod,
      onResponseProgress,
      onResponseSuccess,
      onResponseError,
      setXhrObject: (val) => {
        xhrReq.value = val;
      },
    }).then(({ status, data, list, failedFiles }) => {
      if (status === 'success') {
        setUploadValue(data.files);
        props.onSuccess?.({
          fileList: data.files,
          currentFiles: toUploadFiles.value,
          // 只有全部请求完成后，才会存在该字段
          results: list?.map((t) => t.data),
        });
      }
      // 失败的文件（补充失败的默认文本信息）
      toUploadFiles.value = (failedFiles || []).map((file) => {
        if (!file.response || !file.response.error) {
          if (!file.response) {
            file.response = {};
          }
          file.response.error = global.value.progress.failText;
        }
        return file;
      });
    }, onResponseError);
  }

  function onRemove(p: RemoveContext) {
    uploadValue.value.splice(p.index, 1);
    setUploadValue(uploadValue.value);
    props.onRemove?.(p);
  }

  const tipsClasses = computed(() => {
    return [`${classPrefix.value}-upload__tips ${classPrefix.value}-size-s`];
  });
  const errorClasses = computed(() => {
    return tipsClasses.value.concat(`${classPrefix.value}-upload__tips-error`);
  });

  return {
    t,
    global,
    classPrefix,
    triggerUploadText,
    toUploadFiles,
    uploadValue,
    tipsClasses,
    errorClasses,
    uploadFiles,
    onFileChange,
    onRemove,
  };
}
