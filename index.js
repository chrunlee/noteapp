const electron = require('electron');

const {app,BrowserWindow,ipcMain} = electron;

const url = require('url');

const fs = require('fs');
let baseFolder = 'note';
const path = require('path');

let win;

/***
 * 展示首页内容
 ***/
ipcMain.on('showIndex',(event,arg) => {
	let electronScreen = electron.screen;
	let size = electronScreen.getPrimaryDisplay().workAreaSize;
	win.setSize(size.width,size.height);
	win.center();
	win.loadURL(url.format({
		pathname : path.join(__dirname,'index.html'),
		protoclo : 'file',
		slashes : true
	}));
});
/***
 * 最小化窗口
 ***/
ipcMain.on('minwin',( event ) => {
	win.minimize();
});
/***
 * 创建空文件
 ***/
ipcMain.on('createFile',(event ,obj ) => {
	let id = obj.id, title = obj.title,userName = obj.userName,folder = obj.folder;
	//写入文件
	
	let basePath = path.join(baseFolder,userName,folder);
	let newtitle = getNewTitle(basePath,title);
	console.log(newtitle);
	let filepath = path.join(baseFolder,userName,folder,newtitle);
	fs.writeFile(filepath,'',()=>{
		console.log('file has create success !');
	});
	event.sender.send('createFile-suc',{
		id : id,
		title : newtitle
	});
});
//更新文件标题
ipcMain.on('updateTitle',(event , obj)=>{
	var newtitle = updateTitle(obj);
	event.sender.send('updateTitle-suc',newtitle);
});
//获得文件内容
ipcMain.on('getContent',(event, obj) => {
	var username = obj.username,
		folder= obj.folder,
		filepath = obj.path;
	var content = getContent(username,folder,filepath);
	event.sender.send('loadContent',content);
});
//获得文件夹目录
ipcMain.on('getDir',( event, userName ) => {
	let files = getDir( userName );
	event.sender.send('loadDir',files);
});
//获得文件夹下的文件
ipcMain.on('getNote',( event, obj) => {
	let files = getNote( obj.username ,obj.folder );
	event.sender.send('loadNote',files);
});
ipcMain.on('updateContent',( event , obj ) => {
	updateContent( obj );
	event.sender.send('updateContent-suc');
});

function updateContent ( obj ) {
	let basePath = path.join(__dirname,baseFolder,obj.username,obj.folder,obj.path);
	fs.writeFile(basePath,obj.content,() => {
		console.log('content update success !');
	});
}
function getNewTitle ( basePath, title ) {
	let t =0;
	if(title.indexOf('.md') >-1){
		title = title.replace('.md','');
	}
	let check = function( num ){
		let files = fs.readdirSync(basePath);
		let tempNum = num == 0 ? '' : '('+num+')';
		let tempFileName = title+tempNum+'.md';
		let flag= true;
		files.forEach(function( ele ){
			if(tempFileName == ele){
				flag = false;
			}
		});
		return flag;
	}
	while(!check(t)){
		t ++ ;
	}
	return title+( t== 0 ? '' : '('+t+')')+'.md';
}
//更新文件标题，校验重复
function updateTitle ( obj ) {
	let basePath = path.join(__dirname,baseFolder,obj.username,obj.folder);
	let fileName = obj.path,
		oldFile = obj.old;
	if(oldFile == fileName){
		return fileName;
	}
	
	fileName = getNewTitle(basePath,fileName);
	//更新
	var oldPath = path.join(basePath,oldFile),targetPath = path.join(basePath,fileName);
	fs.rename(oldPath,targetPath,() => {console.log('file rename success!');});
	return fileName;
}
//获得文件内容
function getContent ( username, folder , filepath) {
	var basePath = path.join(__dirname,baseFolder,username, folder,filepath);
	var content = fs.readFileSync(basePath);
	return content.toString();
}
//获得文件目录
function getDir( userName ){
	let basePath = path.join(__dirname,baseFolder,userName);
	let files = fs.readdirSync(basePath);
	return files;
}
//获得文件夹内的文件
function getNote ( userName , folder ) {
	let basePath = path.join(__dirname, baseFolder, userName , folder );
	let files = fs.readdirSync( basePath );
	return files;
}


//创建窗口
function createWindow () {
	win = new BrowserWindow({
		width:800,
		height:500,
		frame:false,
		maximizable : false,
		minimizable : false,
		resizable : false,
		show : false

	});

	win.loadURL(url.format({
		pathname : path.join(__dirname,'login.html'),
		protoclo : 'file',
		slashes : true
	}));

	win.once('ready-to-show',() => {
		win.show();
	});

	win.webContents.openDevTools()

	win.on('closed', () => {
		win = null;
	});
}

//只能跑一个实例
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (myWindow.isMinimized()) win.restore()
    win.focus()
  }
});
if(shouldQuit){
	app.quit();
}

app.on('ready',createWindow);
//窗口关闭
app.on('window-all-closed',() => {
	if( process.platform != 'darwin'){
		app.quit();
	}
});
//创建窗口
app.on('activate',() => {
	if(!win){
		createWindow();
	}
});

