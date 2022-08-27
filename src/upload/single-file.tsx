import { defineComponent, PropType, computed } from 'vue';
import { CloseIcon, ErrorCircleFilledIcon, CheckCircleFilledIcon } from 'tdesign-icons-vue-next';
import props from './props';
import TLoading from '../loading';
import { TdUploadProps, UploadFile } from './type';
import { abridgeName } from './util';
import { useTNodeJSX } from '../hooks/tnode';
// import { useConfig, usePrefixClass } from '../hooks/useConfig';
import { GlobalConfigProvider } from '../config-provider/type';

export interface RemoveContext {
  e: MouseEvent;
  file: UploadFile;
  index: number;
}

export interface SingleFileProps {
  files: TdUploadProps['files'];
  toUploadFiles: TdUploadProps['files'];
  theme: TdUploadProps['theme'];
  placeholder: TdUploadProps['placeholder'];
  tips?: TdUploadProps['tips'];
  classPrefix: string;
  global: GlobalConfigProvider['upload'];
  tipsClasses?: string[];
  errorClasses?: string[];
  onRemove?: (p: RemoveContext) => void;
}

const singleFileProps = {
  files: props.files,
  toUploadFiles: { ...props.files },
  theme: props.theme,
  placeholder: props.placeholder,
  tips: props.tips,
  classPrefix: String,
  global: Object as PropType<SingleFileProps['global']>,
  tipsClasses: Object as PropType<SingleFileProps['tipsClasses']>,
  errorClasses: Object as PropType<SingleFileProps['errorClasses']>,
  onRemove: Function as PropType<SingleFileProps['onRemove']>,
};

export default defineComponent({
  name: 'TUploadSingleFile',

  props: singleFileProps,

  setup(props: SingleFileProps) {
    const renderTNodeJSX = useTNodeJSX();
    // const { classPrefix: prefix } = useConfig('upload');
    const UPLOAD_NAME = computed(() => `${props.classPrefix}-upload`);

    // const showProgress = computed(() => {
    //   return !!(props.loadingFile && props.loadingFile.status === 'progress');
    // });

    // const inputName = computed(() => {
    //   const fileName = props.file && props.file.name;
    //   const loadingName = props.loadingFile && props.loadingFile.name;
    //   return showProgress.value ? loadingName : fileName;
    // });
    // const inputText = computed(() => {
    //   return inputName.value || props.placeholder;
    // });
    const inputTextClass = computed(() => {
      return [`${props.classPrefix}-input__inner`, { [`${UPLOAD_NAME.value}__placeholder`]: true }];
    });
    const classes = computed(() => {
      return [`${UPLOAD_NAME.value}__single`, `${UPLOAD_NAME.value}__single-${props.theme}`];
    });

    const renderProgress = (percent: number) => {
      return (
        <div class={`${UPLOAD_NAME.value}__single-progress`}>
          <TLoading />
          <span class={`${UPLOAD_NAME.value}__single-percent`}>{percent}%</span>
        </div>
      );
    };

    // 文本型预览
    const renderFilePreviewAsText = () => {
      if (props.theme !== 'file') return null;
      return props.files.map((file, index) => (
        <div class={`${UPLOAD_NAME.value}__single-display-text ${UPLOAD_NAME.value}__display-text--margin`}>
          <span class={`${UPLOAD_NAME.value}__single-name`}>{file.name}</span>
          {file.status === 'waiting' && renderProgress(file.percent)}
          {file.status === 'success' && (
            <CloseIcon
              class={`${UPLOAD_NAME.value}__icon-delete`}
              onClick={({ e }: { e: MouseEvent }) => props.onRemove({ e, file, index })}
            />
          )}
        </div>
      ));
    };

    // 输入框型预览
    const renderFilePreviewAsInput = () => {
      if (props.theme !== 'file-input') return;
      const renderResult = () => {
        // if (!!props.loadingFile && props.loadingFile.status === 'fail') {
        //   return <ErrorCircleFilledIcon />;
        // }
        // if (props.file && props.file.name && !props.loadingFile) {
        //   return <CheckCircleFilledIcon />;
        // }
        return '';
      };

      return (
        <div class={`${UPLOAD_NAME.value}__single-input-preview ${props.classPrefix}-input`}>
          <div class={inputTextClass.value}>
            {<span class={`${UPLOAD_NAME.value}__single-input-text`}>{abridgeName('', 4, 6)}</span>}
            {/* {showProgress.value && renderProgress()} */}
            {renderResult()}
          </div>
        </div>
      );
    };

    return () => (
      <div class={classes.value}>
        {renderFilePreviewAsInput()}
        {renderTNodeJSX('default')}
        {props.tips && <small class={props.tipsClasses}>{props.tips}</small>}
        {renderFilePreviewAsText()}
        {props.toUploadFiles
          ?.filter((t) => t.response?.error)
          .map((file) => (
            <small class={props.errorClasses}>
              {file.name} {file.response?.error}
            </small>
          ))}
      </div>
    );
  },
});
