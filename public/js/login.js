const {ipcRenderer} = require('electron');

$('.btn').on('click',function(){
	$('.btn').html('登录中...');
	let user = $('input[name="username"]').val();
	let pwd = $('input[name="password"]').val();

	if(user == 'lixun' && pwd == '123' ){
		//登录成功,跳转页面
		ipcRenderer.send('showIndex','lixun');
	}else{
		$('.btn').html('登录');
		$('#msg').html('用户名或密码错误!');
		setTimeout(function(){
			$('#msg').html('');
		},1500);
	}
});
