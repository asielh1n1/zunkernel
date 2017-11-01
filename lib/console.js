var ZunKernel=require('zunkernel').ZunKernel;
zun=new ZunKernel();
zun.init('command');
zun.execCommand(process.argv.slice(2,process.argv.length));