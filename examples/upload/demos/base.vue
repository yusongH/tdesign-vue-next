<template>
  <!-- :sizeLimit="1024" 默认单位为：KB 。错误提示为 图片大小不能超过 {sizeLimit} KB-->
  <!-- :sizeLimit="{ size: 2, unit: 'MB' }" -->
  <!-- :sizeLimit="{ size: 2, unit: 'MB', message: '图片太大' }" -->
  <!-- :sizeLimit="{ size: 2, unit: 'MB', message: '图片太大，不能超过 {sizeLimit} MB' }" -->
  <t-space direction="vertical">
    <t-space>
      <t-radio-group v-model="multiple" variant="default-filled">
        <t-radio-button :value="false">单文件上传</t-radio-button>
        <t-radio-button :value="true">多文件上传</t-radio-button>
      </t-radio-group>
    </t-space>
    <t-space>
      <t-checkbox v-if="multiple" v-model="uploadInOneRequest">一次上传全部文件</t-checkbox>
      <t-checkbox v-model="autoUpload">自动上传</t-checkbox>
      <t-button
        v-if="!autoUpload"
        variant="base"
        theme="default"
        style="padding: 0 4px; height: 22px"
        @click="uploadFiles"
      >
        点击上传文件
      </t-button>
    </t-space>

    <br />

    <!-- formatRequest 用于修改或新增上传请求数据，示例：:format-request="(obj) => ({ ...obj, other: 123 })" -->
    <!-- tips 和 placehodler 的区别：tips 会一直存在，placeholder 尽在空文件时显示 -->
    <t-upload
      ref="uploadRef"
      v-model="files"
      action="https://service-bv448zsw-1257786608.gz.apigw.tencentcs.com/api/upload-demo"
      :placeholder="multiple ? '文件数量不超过 5 个，要求文件大小在 1M 以内' : '请上传文件，要求文件大小在 1M 以内'"
      :multiple="multiple"
      :auto-upload="autoUpload"
      :upload-all-files-in-one-request="uploadInOneRequest"
      :size-limit="{ size: 1, unit: 'MB' }"
      :max="5"
      @select-change="handleSelectChange"
      @fail="handleFail"
      @success="handleSuccess"
      @one-file-success="onOneFileSuccess"
      @validate="onValidate"
      @waiting-upload-files-change="onWaitingUploadFilesChange"
    >
      <!-- 示例代码有效，勿删，用于演示如何自定义文件列表内容 -->
      <!-- <template #fileListDisplay="{ displayFiles }">
        <div>
          <div
            v-for="(file, index) in displayFiles"
            :key="file.name"
            class="t-upload__single-display-text t-upload__display-text--margin"
          >
            {{ file.name }}（{{ file.size }} B）
            <CloseIcon class="t-upload__icon-delete" @click="() => outsideRemove(index)" />
          </div>
        </div>
      </template> -->
    </t-upload>
  </t-space>
</template>
<script setup>
import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { CloseIcon } from 'tdesign-icons-vue-next';

const files = ref([
  {
    name: '这是一个默认文件',
    status: 'success',
    url: 'https://tdesign.gtimg.com/site/source/figma-pc.png',
    size: 1000,
  },
]);
const autoUpload = ref(true);
const multiple = ref(false);
const uploadInOneRequest = ref(false);
const uploadRef = ref();

const handleFail = () => {
  MessagePlugin.error(`文件 ${files.value[0].name} 上传失败`);
};

const handleSelectChange = (files) => {
  console.log('onSelectChange', files);
};

const handleSuccess = () => {
  MessagePlugin.success('上传成功');
};

// 多文件上传，一个文件一个请求场景，每个文件也会单独触发上传成功的事件
const onOneFileSuccess = (params) => {
  console.log('onOneFileSuccess', params);
};

// 文件大小、文件数量等不通过时会触发
const onValidate = (params) => {
  const { files, type } = params;
  console.log('onValidate', params);
  if (type === 'FILE_OVER_SIZE_LIMI') {
    files.map((t) => t.name).join('、');
    console.log(`${files.map((t) => t.name).join('、')} 等文件大小超出限制`);
  } else if (type === 'FILES_OVER_LENGTH_LIMIT') {
    MessagePlugin.warning('文件数量超出限制，仅上传未超出数量的文件');
  }
};

// 仅自定义文件列表所需
const outsideRemove = (index) => {
  files.value.splice(index, 1);
};

// 非自动上传文件，需要在父组件单独执行上传请求
const uploadFiles = () => {
  uploadRef.value.uploadFiles();
};

// 非自动上传文件，需保存待上传文件列表
const waitingUploadFiles = ref([]);
const onWaitingUploadFilesChange = (files) => {
  waitingUploadFiles.value = files;
};
</script>
