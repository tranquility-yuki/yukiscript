// ==UserScript==
// @name         dobroarchreader
// @namespace    udp://insomnia/*
// @version      0.1
// @description  Write something useful!
// @match        *://dobrochan.com/*/res/*
// @match        *://dobrochan.org/*/res/*
// @match        *://dobrochan.ru/*/res/*
// @updateURL    https://github.com/tranquility-yuki/yukiscript/raw/master/dobroarchreader.user.js
// @copyright    2015+, tranquility.yuki
// @run-at       document-end
// ==/UserScript==

var m = document.location.href.match( /https?:\/\/([^\/]+)\/([^\/]+)\/((\d+)|res\/(\d+)|\w+)(\.x?html)?(#i?(\d+))?/),
	parsedURL = m?{host:m[1], board:m[2], page:m[4], thread:m[5], pointer:m[8]}:{};

var bytesMagnitude = function(bytes){
	"use strict";
	if(bytes < 1024){
		return bytes + ' B';
	}else if (bytes < 1024 * 1024){
		return (bytes / 1024).toFixed(2) + ' KB';
	}else{
		return (bytes / 1024 / 1024).toFixed(2) + ' MB';
	}
};

function renderFiles(files, threadId, postId){
	if(files.length === 0) return '';

	var out = '', file, fileName;

	if(files.length == 1) {
		file = files[0];
		filename = file.src.match(/.+\/([^\/]+)/)[1];
		return '<div class="fileinfo">' +
			'    Файл: <a href="/' + file.src +'" target="_blank">' + filename + '</a><br />' +
			'    <em>' + file.type + ', ' + bytesMagnitude(file.size) + (file.type == 'image' ? ', ' + file.metadata.width + '×' + file.metadata.height : '') + '</em>' +
			'    <br />' +
			(file.type == 'image' ?'   	<a class="search_google icon" onclick="window.open(this.href,\'_blank\');return false;"  href="http://www.google.com/searchbyimage?image_url=http://dobrochan.com/' + file.src +'"><img src="/images/blank.png" title="Find source with google" alt="Find source with google" /></a>' + 
			'   	<a class="search_iqdb icon" onclick="window.open(this.href,\'_blank\');return false;"  href="http://iqdb.org/?url=http://dobrochan.com/' + file.src +'"><img src="/images/blank.png" title="Find source with iqdb" alt="Find source with iqdb" /></a>' : '')+
			'</div>' +
			'<div id="file_' + postId + '_' + file.file_id + '" class="file">  ' +
			'    <a href="/' + file.src +'" target="_blank"><img src="/' + file.thumb +'" width="' + file.thumb_width + '" height="' + file.thumb_height + '" class="thumb"  alt="' + filename + 
			(file.type == 'image' ? '" onclick="expand_image(event, ' + file.metadata.width + ', ' + file.metadata.height + ')"' : '') +
			' /></a></div>';
	}

	for (var i = 0; i < files.length; i++) {
		file = files[i];
		filename = file.src.match(/.+\/([^\/]+)/)[1];
		out +=
			'<div id="file_' + postId + '_' + file.file_id + '" class="file">  ' +
			'<div class="fileinfo limited">' +
			'    Файл: <a href="/' + file.src +'" target="_blank">' + filename + '</a><br />' +
			'    <em>' + file.type + ', ' + bytesMagnitude(file.size) + (file.type == 'image' ? ', ' + file.metadata.width + '×' + file.metadata.height : '') + '</em>' +
			'    <br />' +
			(file.type == 'image' ?'   	<a class="search_google icon" onclick="window.open(this.href,\'_blank\');return false;"  href="http://www.google.com/searchbyimage?image_url=http://dobrochan.com/' + file.src +'"><img src="/images/blank.png" title="Find source with google" alt="Find source with google" /></a>' + 
			'   	<a class="search_iqdb icon" onclick="window.open(this.href,\'_blank\');return false;"  href="http://iqdb.org/?url=http://dobrochan.com/' + file.src +'"><img src="/images/blank.png" title="Find source with iqdb" alt="Find source with iqdb" /></a>' : '')+
			'</div>' +
			
			'    <a href="/' + file.src +'" target="_blank"><img src="/' + file.thumb +'" width="' + file.thumb_width + '" height="' + file.thumb_height + '" class="thumb"  alt="' + filename + 
			(file.type == 'image' ? '" onclick="expand_image(event, ' + file.metadata.width + ', ' + file.metadata.height + ')"' : '') +
			' /></a></div>';
	}

	return out + '<br style="clear: both" />';
}

function renderPost(post, threadId){
	var out = 
		'<a name="i3843065"></a>' +
		'    <label>' +
		(post.subject ? '        <span class="replytitle">' + post.subject +'</span> ' : '') +
		(post.name ? '        <span class="postername">' + post.name +'</span> ' : '<span class="postername">Анонимус</span> ') +		
		post.date +
		'    </label>' +
		'    <span class="reflink"><a href="/' + parsedURL.board + '/res/' + threadId + '.xhtml#' + post.display_id + '">No.' + post.display_id + '</a></span>' +
		'    <br />' +
		renderFiles(post.files, threadId, post.display_id) + 
		'    <div class="postbody"><div class="message">' + post.message_html + '</div></div>' +
		'    <div class="abbrev"></div>' +
		'</div>';

	if(post.op) return '<div id="post_' + post.display_id + '" class="oppost post">' + out + '</div>';
	
	return '<table id="post_' + post.display_id + '" class="replypost post"><tbody><tr><td class="doubledash">&gt;&gt;</td><td class="reply" id="reply' + 
		   post.display_id + '">' + out + '</td></tr></tbody></table>';
}

function renderThread(data){
	var thread = data.result.threads[0],
		out = '<div class="thread" id="thread_' + thread.display_id + '">';

	for (var i = 0; i < thread.posts.length; i++) {
		out += renderPost(thread.posts[i], thread.display_id);
	}

	return out + '</div>';
}

if($('center h2').text().match(/.+403$/)){
	$('center h2').after('<p><input type="button" value="Try API" id="arch_tryapi"></p>');
	
	$('#arch_tryapi').on('click', function(){
		$('#arch_tryapi').attr('disabled','disabled');
		$.getJSON( "/api/thread/" + parsedURL.board + "/" + parsedURL.thread + "/all.json?new_format&message_html&board&thread", function(data) {
			$('center').replaceWith(renderThread(data));            
		});
	});
}
