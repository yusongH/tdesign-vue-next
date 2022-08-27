import { toRefs, ref } from 'vue';
import { SizeLimitObj, TdUploadProps, UploadFile } from './type';
import { getFilesAndErrors, validateFile, upload } from '../_common/js/upload/main';
import useVModel from '../hooks/useVModel';
import { useConfig } from '../hooks/useConfig';
import { OnResponseErrorContext, SuccessContext } from '../_common/js/upload/types';

/**
 * 上传组件全部逻辑，方便脱离 UI，自定义 UI 组件
 */
export default function useUpload(props: TdUploadProps) {
  const { files, modelValue } = toRefs(props);
  const { global, t } = useConfig('upload');
  const [uploadValue, setUploadValue] = useVModel(files, modelValue, props.defaultFiles || [], props.onChange, 'files');
  // TODO: 可能存在多个请求，一个不够
  const xhrReq = ref<XMLHttpRequest>();
  const toUploadFiles = ref<UploadFile[]>([]);

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

  const onResponseProgress = () => {};

  const onResponseSuccess = (p: SuccessContext) => {
    props.onSuccess?.({
      e: p.event,
      file: p.file,
      fileList: p.files,
      currentFiles: p.files,
      response: p.response,
    });
  };

  function getError(sizeLimitObj: SizeLimitObj) {
    const limit = sizeLimitObj;
    return limit.message
      ? t(limit.message, { sizeLimit: limit.size })
      : `${t(global.value.sizeLimitMessage, { sizeLimit: limit.size })} ${limit.unit}`;
  }

  function onFileChange(files: FileList) {
    if (props.disabled) return;
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
        const { firstError, toFiles } = getFilesAndErrors(args.fileValidateList, getError);
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
      isBatchUpload: props.isBatchUpload,
      uploadAllFilesInOneRequest: props.uploadAllFilesInOneRequest,
      action: props.action,
      requestMethod: props.requestMethod,
      onResponseProgress,
      onResponseSuccess,
      onResponseError,
      setXhrObject: (val) => {
        xhrReq.value = val;
      },
    }).then(({ status, data, list }) => {
      if (status === 'success') {
        setUploadValue(data.files);
        props.onSuccess?.({
          fileList: data.files,
          currentFiles: toUploadFiles.value,
          // 只有全部请求完成后，才会存在该字段
          results: list.map((t) => t.data),
        });
      }
    }, onResponseError);
  }

  return {
    uploadFiles,
    onFileChange,
  };
}
