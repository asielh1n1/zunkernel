var ZunKernel=require('zunkernel').ZunKernel;
zun=new ZunKernel('command');
zun.execCommand(process.argv.slice(2,process.argv.length));