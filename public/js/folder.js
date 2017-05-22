const {ipcRenderer,remote} = require('electron');

const {Menu,MenuItem} = remote;

const userName = 'lixun';

var note = null;

//定义一个笔记
const Note = function( params ){

	this.userName = params.userName;
	this.ipc = params.ipc;
	this.$folder = $('.index-folder');
	this.$note = $('.index-note');
	this.nowFolder = '';
	return this;
};

Note.prototype = {
	//获得信息
	getInfo : function(){
		//1. 获得选中的目录
		//2. 获得选中的文件
		let thiz = this,$folder = thiz.$folder, $note = thiz.$note,userName = thiz.userName;
		if($note.find('.index-note-block.selected').length > 0){
			let $sel = $note.find('.index-note-block.selected'),path = $sel.attr('path'),folder = $sel.attr('folder');
			return {
				userName : userName,
				folder : folder,
				path : path
			}
		}else{
			let $sel = $folder.find('.index-folder-block.selected');
			return {
				userName : userName,
				folder : $sel.attr('path')
			}
		}
	},
	//获取目录
	getDir : function(){

	},
	//加载目录
	loadDir : function( event , files ){
		let html = '';
		files.forEach(( file ) => {
			html += '<div path="'+file+'" class="index-folder-block"><i class="fa fa-folder"></i>'+file+'</div>';
		});
		this.$folder.html(html);
	},
	//加载目录下的笔记
	loadNote : function( event , files ){
		let thiz = this;
		let html = '';
		files.forEach(( file ) => {
			var id = thiz.getRandom();
			html += '<div class="index-note-block" path="'+file+'" folder="'+this.nowFolder+'" id="'+id+'"><span class="title">'+file+'</span><span class="zhaiyao"></span><span class="time">2016-05-05</span></div>';
		});
		this.$note.html(html);
	},
	//获取笔记
	getNote : function( ev ){
		let $this = $(ev.currentTarget || ev.srcElement);
		let path = $this.attr('path');
		$this.parent().find('.selected').removeClass('selected');
		$this.addClass('selected');
		this.nowFolder = path;
		this.ipc.send('getNote',{username : this.userName , folder : path});
	},
	//加载笔记内容
	loadContent : function( event , content ){
		let $textarea = $('textarea');
		$textarea.val(content);
		this.prettyMd();
	},
	//获取笔记内容
	getContent : function( ev ){
		let thiz = this;
		let $this = $(ev.currentTarget || ev.srcElement),
			folder = $this.attr('folder'),
			id = $this.attr('id'),
			path = $this.attr('path');
		$('.index-note-block.selected').removeClass('selected');
		$this.addClass('selected');
		$('.note-title input').val(path.replace('.md',''));
		//请求内容赋值
		thiz.ipc.send('getContent',{
			username : thiz.userName,
			folder : folder,
			path : path
		});
	},
	//更新标题
	updateTitleSuc : function( event , newTitle ){
		let $select = $('.index-note-block.selected');
		$select.attr('path',newTitle);
		$select.find('.title').html(newTitle);
		$('.note-title input').val(newTitle.replace('.md',''));
	},
	updateTitle : function(){
		let title = $.trim($('.note-title input').val());
		let path = title+'.md';
		let $selected = $('.index-note-block.selected'),
			folder = $selected.attr('folder'),
			old = $selected.attr('path');

		//更新
		$('.index-note-block.selected').find('.title').html(path);
		//更新文件标题
		this.ipc.send('updateTitle',{
			username : this.userName,
			folder : folder,
			path :path,
			old : old
		});
	},
	prettyMd : function(){
		let $textarea = $('textarea');
		let val = $textarea.val();
		let html = marked(val);
		$('.content .right').html(html);
	},
	//获得随机数
	getRandom : function( prefix ){
		var counter = 0;
	    return (function( prefix ) {
	        var guid = (+new Date()).toString( 32 ),i = 0;
	        for ( ; i < 5; i++ ) {
	            guid += Math.floor( Math.random() * 65535 ).toString( 32 );
	        }
	        return (prefix || 'byy_') + guid + (counter++).toString( 32 );
	    })( prefix );
	},
	//更新笔记内容
	updateContent : function(){
		//更新笔记内容
		let thiz = this,ipc = thiz.ipc,userName = thiz.userName;
		thiz.prettyMd();
		let content = $('textarea').val();
		let $select = $('.index-note-block.selected');
		let folder = $select.attr('folder'),
			path = $select.attr('path');
		ipc.send('updateContent',{
			username : userName,
			folder : folder,
			path : path,
			content : content
		});
	},
	createFileSuc : function( obj ){
		let id = obj.id,title = obj.title;
		$('#'+id).attr('path',title);
		let newt = title.replace('.md','');
		$('#'+id).find('.title').html(newt);
		$('.note-title').find('input').val(newt);
	},
	createNoteFile : function( id ){
		let $sel = $('#'+id),title = $sel.find('.title').html()+'.md',folder = $sel.attr('folder');
		let thiz = this,ipc = thiz.ipc,userName = thiz.userName;
		ipc.send('createFile',{
			title : title,
			id : id,
			userName : userName,
			folder : folder
		});
	},
	//创建新的笔记
	createNewNote : function(){
		console.log('new note');
		//1.增加新的note-block
		let thiz = this,$note = thiz.$note,info = thiz.getInfo(),id = thiz.getRandom(),title = '新建文本文档';
		console.log(info);
		$note.prepend('<div class="index-note-block" folder="'+info.folder+'" id="'+id+'" ><span class="title">'+title+'</span><span class="zhaiyao"></span><span class="time">2017-05-05</span></div>');
		//赋值
		$note.find('.selected').removeClass('selected');
		$note.find('.index-note-block:eq(0)').addClass('selected');
		$('.note-title').find('input').val(title);
		$('textarea').val('');
		$('.right').html('');
		//修正名称
		thiz.createNoteFile(id);
	},
	//删除笔记
	deleteNote : function(){
		console.log('delete note');
	}
};

Note.prototype.init = function(){
	let thiz = this,ipc = thiz.ipc,$folder = thiz.$folder,$note = thiz.$note;
	ipc.send('getDir',thiz.userName);
	ipc.on('loadDir',( event , files )=>{
		thiz.loadDir(event , files );	
	});
	ipc.on('loadNote',( e ,f )=>{
		thiz.loadNote(e,f);	
	});
	ipc.on('loadContent',(e,f)=>{
		thiz.loadContent(e,f);	
	});
	ipc.on('updateTitle-suc',(e,t)=>{
		thiz.updateTitleSuc(e,t);	
	});
	ipc.on('createFile-suc',(e,t)=>{
		thiz.createFileSuc(t);
	});
	$folder.on('click','.index-folder-block',( e )=>{
		thiz.getNote( e );	
	});
	$note.on('click','.index-note-block',(e)=>{
		thiz.getContent( e );
	});

	$('#minwin').on('click',() => {ipc.send('minwin');});
	$('#closewin').on('click',()=> {window.close();});
	$('.note-title').on('blur','input',() =>{
		thiz.updateTitle();	
	});
	$('textarea').on('keyup',() =>{
		thiz.updateContent();
	});
}

//定义一个菜单
const menu = new Menu();
menu.append(new MenuItem({label : '新建笔记',click(){
	note.createNewNote();
}}));
menu.append(new MenuItem({label : '删除笔记',click(){
	note.deleteNote();
}}));
window.addEventListener('contextmenu',( ev )=> {
	// ev.preventDefault();
	let srcele = ev.srcElement || ev.currentTarget,
		$srcele = $(srcele),$srcp = $srcele.parent();
	if($srcele.hasClass('index-note-block') || $srcp.hasClass('index-note-block')){
		menu.popup(remote.getCurrentWindow());
	}
},false);

note = new Note({
	userName : userName,
	ipc : ipcRenderer
});
note.init();