import FileBrowser from './FileBrowser.js';

let fileManagerHTML =`<html>
		<head>
			<title>Downrush File Manager</title>
			<meta name="viewport" content="width=device-width">
			<meta charset="UTF-8">
		</head>
		<style type="text/css">
			a { text-decoration: none; }
			table {
				/*border-collapse: collapse;*/
				border-collapse:separate;
			    width: 100%;
			}
			td {
				background-color: #F0F0F0;
				border: solid 1px #888888;
				color: black;
			}
			body {
 			   	margin: 0;
			}
			#header {
				font-size: 14pt;
			}
			.tab_check {
				width: 1em;
			}
			.table_name {
				/*width: 100px;*/
				position:relative;
				/* margin:0px auto 20px 50px; */
				color: #0000FF
			}
			.table_name a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_sort a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_bts {
				position:relative;
				/*margin:0px auto 20px;*/
			    text-align: center;
			}
			.table_bts a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_eye {
				width: 2em;
				position:relative;
			    text-align: center;
			}
			.table_eye a {
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.table_dts {
				width: 4em;
				position:relative;
			    text-align: right;
			}
		
			.table_cmd {
				width: 2.5em;
				position:relative;
			    text-align: center;
			}
			.table_cmd a{
				position:absolute;
				top:0;
				left:0;
				width:100%;
				height:100%;
			}
			.nobord * {
				border: none;
				background-color: white;
				width: auto;
			}

			#uploader {
				background-color: #FFFFF0;
			}

			.tinygap {
			font-size: 2pt;
			}

			@media (max-width: 800px) {
				.wrapper {
					margin: 0 0 0 2px;
					width: 100%;
					word-wrap: break-word;
				}
			}
			@media (min-width: 800px) {
				.wrapper {
					margin: 0 0 0 2px;
					width: 800px;
					word-wrap: break-word;
				}
			}
 
		</style>
		<body>
			<div id="header">
				
			</div>
			<hr>
			<div class="wrapper">
				<table id="filetable"></table>
			</div>

			<div id="uploader">
				<form action="/upload.cgi" method="post" enctype="multipart/form-data" target="hogehogeFrame" >
					<input name="file" type="file" />
					<input id='uploadbut' type="submit" value="upload"/>
					<iframe src="about:blank" id="hogehogeFrame" name="hogehogeFrame" style="display:none;"></iframe>
				</form>
			<br>Drag and drop files and folders to upload here.<br><div id="statind"></div>
			</div>
			<input id='newdirbut' type="button" value="New Directory">
			<input id='deletebut' type="button" value="Remove Checked Files">
			<input id='renamebut' type="button" value="Rename Checked File">
			<hr>
			<div class = 'nobord'>
			<table class='nobord'><tr>
			<td><div id="reloadtime"></div></td>
			<td><a id='reloadbut' href="javascript:void(0)">[Reload]</a></td>
			<td><input type="checkbox" id="FullFileList" value="0">Show Hiddens</input></td>
			<td><a id='wifi0' href="/DR/FTF/wifioff.lua">Wifi Off</a>
		</tr></table></div>
</body>
</html>`;
document.write(fileManagerHTML);
var browser = new FileBrowser();
browser.start();
