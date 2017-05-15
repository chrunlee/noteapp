const {ipcRenderer} = require('electron');

const userName = 'lixun';

ipcRenderer.send('getDir',userName);
let nowFolder;
ipcRenderer.on('loadDir', (event , files ) => {
	let html = '';
	files.forEach(( file ) => {
		html += '<div path="'+file+'" class="index-folder-block"><i class="fa fa-folder"></i>'+file+'</div>';
	});
	let $folder = $('.index-folder');
	$folder.html(html);
});
function getRandom ( prefix ) {
	var counter = 0;
    return (function( prefix ) {
        var guid = (+new Date()).toString( 32 ),i = 0;
        for ( ; i < 5; i++ ) {
            guid += Math.floor( Math.random() * 65535 ).toString( 32 );
        }
        return (prefix || 'byy_') + guid + (counter++).toString( 32 );
    })( prefix )
};
ipcRenderer.on('loadNote',(event , files) => {
	let html = '';
	files.forEach(( file ) => {
		var id = getRandom();
		html += '<div class="index-note-block" path="'+file+'" folder="'+nowFolder+'" id="'+id+'"><span class="title">'+file+'</span><span class="zhaiyao"></span><span class="time">2016-05-05</span></div>';
	});
	let $folder = $('.index-note');
	$folder.html(html);
});

ipcRenderer.on('loadContent',( event , content ) => {
	let $textarea = $('textarea');
	$textarea.val(content);
	showMD();
});

ipcRenderer.on('updateTitle-suc',( event , newTitle ) => {
	let $select = $('.index-note-block.selected');
	$select.attr('path',newTitle);
	$select.find('.title').html(newTitle);
	$('.note-title input').val(newTitle.replace('.md',''));
});
function showMD (){
	let $textarea = $('textarea');
	let val = $textarea.val();
	var html = marked(val);
	$('.content .right').html(html);
	// prettyPrint();
}


$('.index-folder').on('click','.index-folder-block',( ev ) => {
	let $this = $(ev.currentTarget || ev.srcElement);
	let path = $this.attr('path');
	nowFolder = path;
	ipcRenderer.send('getNote',{username : userName , folder : path});
});

$('.index-note').on('click','.index-note-block',( ev ) => {
	let $this = $(ev.currentTarget || ev.srcElement),
		folder = $this.attr('folder'),
		id = $this.attr('id'),
		path = $this.attr('path');
	$this.addClass('selected');
	$('.note-title input').val(path.replace('.md',''));
	//请求内容赋值
	ipcRenderer.send('getContent',{
		username : userName,
		folder : folder,
		path : path
	});
});
$('textarea').on('keyup',() => {
	showMD();
	//更新笔记内容
	let content = $('textarea').val();
	let $select = $('.index-note-block.selected');
	let folder = $select.attr('folder'),
		path = $select.attr('path');
	ipcRenderer.send('updateContent',{
		username : userName,
		folder : folder,
		path : path,
		content : content
	});
});

$('#minwin').on('click',() => {
	ipcRenderer.send('minwin');
});

$('#closewin').on('click',() => {
	window.close();
});
$('.note-title').on('blur','input',( ev ) => {
	let title = $('.note-title input').val();
	let path = title+'.md';
	let $selected = $('.index-note-block.selected'),
		folder = $selected.attr('folder'),
		old = $selected.attr('path');

	//更新
	$('.index-note-block.selected').find('.title').html(path);
	//更新文件标题
	ipcRenderer.send('updateTitle',{
		username : userName,
		folder : folder,
		path :path,
		old : old
	});
});
//右键菜单
$('.index-note-block').on('contextmenu',() => {
	return false;
});
$('.index-note-block').on('mousedown',( ev ) => {
	if(ev.which == 3){
		alert('右键');
	}
});