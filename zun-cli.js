var ZunKernel=require('zunkernel').ZunKernel;
var zunframework=new ZunKernel();
zunframework.init('command');
zunframework.execCommand(process.argv.slice(2,process.argv.length));