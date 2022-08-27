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
      <t-checkbox v-model="autoUpload">自动上传</t-checkbox>
      <t-checkbox v-if="multiple" v-model="uploadInOneRequest">一次上传全部文件</t-checkbox>
    </t-space>

    <br />
    <!-- 上传接口默认只传一个参数，如果希望自定义参数，可以使用 format 方法格式化参数-->
    <t-upload
      v-model="files"
      action="https://service-bv448zsw-1257786608.gz.apigw.tencentcs.com/api/upload-demo"
      tips="要求文件大小在 1M 以内"
      :multiple="multiple"
      :auto-upload="autoUpload"
      :upload-all-files-in-one-request="uploadInOneRequest"
      :size-limit="{ size: 1, unit: 'MB' }"
      @select-change="handleSelectChange"
      @fail="handleFail"
      @success="handleSuccess"
      @one-file-success="onOneFileSuccess"
    ></t-upload>
  </t-space>
</template>
<script setup>
import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';

const files = ref([]);
const autoUpload = ref(true);
const multiple = ref(false);
const uploadInOneRequest = ref(false);

const handleFail = () => {
  MessagePlugin.error(`文件 ${files.value[0].name} 上传失败`);
};

const handleSelectChange = (files) => {
  console.log('onSelectChange', files);
};

const handleSuccess = () => {
  MessagePlugin.success('上传成功');
};

const onOneFileSuccess = (params) => {
  console.log('onOneFileSuccess', params);
};
</script>
