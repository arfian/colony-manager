$.fn.ecFileBrowser = function (method) {
	if (methodsFB[method]) {
		return methodsFB[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsFB['init'].apply(this,arguments);
	}
}


var Settings_EcFileBrowser = {
	dataSource: {data:[]},
	serverSource: {data:[]}
}

var Setting_ServerSource = {
	data: [],
	url: '',
	call: 'POST',
	callData: 'q',
	timeout: 20,
	dataTextField:"text",
	dataValueField:"value",
	callOK: function(res){
		// console.log('callOK');
	},
	callFail: function(a,b,c){
		// console.log('callFail');
	}
};

var Setting_DataSource = {
	data: [],
	url: '',
	call: 'POST',
	callData: 'q',
	timeout: 20,
	pathField : 'path',
	nameField:'text',
	hasChildrenField:'hasChild',
	callOK: function(res){
		// console.log('callOK');
	},
	callFail: function(a,b,c){
		// console.log('callFail');
	}
};

var templatetree = "#: item.text# "+
             "<a style='display:none' path=\"#:item.pathf #\" name=\"#:item.text #\" permission=\"#:item.permissions#\"></a> ";

var methodsFB = {
	init:function(options){
		var settings = $.extend({}, Settings_EcFileBrowser, options || {});
		var settingsSource = $.extend({}, Setting_DataSource, settings['dataSource'] || {});
		var serverSource = $.extend({}, Setting_ServerSource, settings['serverSource'] || {});
		settings["dataSource"] = settingsSource;
		settings["serverSource"] = serverSource;

		settings["dataSource"].GetDirAction = "GetDir";
		settings["dataSource"].originUrl = settingsSource.url;

		templatetree = templatetree.replace("text",options.dataSource.nameField).replace("text",options.dataSource.nameField);
		templatetree = templatetree.replace("pathf",options.dataSource.pathField);

		this.each(function () {
			$(this).data("ecFileBrowser", settings);
		});

		if(serverSource.data.length==0||serverSource.url!=""){
			methodsFB.CallAjaxServer(this,settings);
		}else{
			methodsFB.BuildFileExplorer(this, settings);
		}
		return 
	},
BuildFileExplorer:function(elem,options){
		var $ox = $(elem), $container = $ox.parent(), idLookup = $ox.attr('id');
		var data = options.dataSource.data;
		var serverId = "";

		strcont = "<div class='col-md-12 fb-container'></div>";
		$strcont = $(strcont);
		$strcont.appendTo($ox);

		$strscroller_anchor = $("<div class='scroller_anchor'></div>");
		$strscroller_anchor.appendTo($strcont);

		$strprecont  = $("<div class='col-md-12'></div>");
		$strprecont.appendTo($strcont);

		$strscroller = $("<div class='scroller'></div>");
		$strscroller.appendTo($strprecont);

		strpreserv = "<div class='col-md-3 fb-pre'></div>";
		$strpreserv = $(strpreserv);
		$strpreserv.appendTo($strscroller);

		strserv = "<div class='col-md-12'><label class='col-md-4 label-title'>Server</label><div class='col-md-8'><input class='fb-server'></input></div></div>";
		$strserv = $(strserv);
		$strserv.appendTo($strpreserv);

		strprebtn = "<div class='col-md-6 fb-pre'></div>";
		$strprebtn = $(strprebtn);
		$strprebtn.appendTo($strscroller);

		$strcontbtn = $("<div class='col-md-12 btn-cont'></div>");

		$strtoolbar = $("<div class='btn-toolbar' role='toolbar'></div>");
		$strtoolbar.appendTo($strcontbtn);

		$strbtngrpMode = $("<div class='btn-group' role='group'>");
		$strbtngrpMode.appendTo($strtoolbar);

		$strbtngrp = $("<div class='btn-group' role='group'>");
		$strbtngrp.appendTo($strtoolbar);
		
		$strbtn = $("<button class='btn btn-sm btn-primary tooltipster btn-treeview' title='Tree View'><span class='glyphicon glyphicon-indent-left'></span></button>");
		$strbtn.appendTo($strbtngrpMode);
		$strbtn.click(function(){
			$(elem).find(".fb-thumbview").hide();
			$(elem).find(".fb-tree").show();
			$(this).prop("disabled",true);
			$(elem).find(".btn-thumbnail").prop("disabled",false);
			$(this).tooltipster('hide');
		});

		$strbtn = $("<button class='btn btn-sm btn-primary tooltipster btn-thumbnail' title='Thumbnail View'><span class='glyphicon glyphicon-th'></span> </button>");
		$strbtn.appendTo($strbtngrpMode);
		$strbtn.click(function(){
			var SelectedPath = $($(elem).find(".k-state-selected")).length > 0 ?  $($($(elem).find(".k-state-selected")).find("a")).attr("path"):null;
			if(SelectedPath != null){
				var name = $($($(elem).find(".k-state-selected")).find("a")).attr("name");
				var type = methodsFB.DetectType($(elem).find(".k-state-selected"),name,elem);

				if(type == "folder"){
					methodsFB.ThumbnailView(elem,options,{serverId: serverId, path:SelectedPath});
				}else{
					var parentDir = SelectedPath.substring(SelectedPath.indexOf('/'), SelectedPath.lastIndexOf('/'));
					methodsFB.ThumbnailView(elem,options,{serverId: serverId, path:parentDir});
				}
			}else{
				methodsFB.ThumbnailView(elem,options,{serverId: serverId, path:SelectedPath});
			}
			
			
			$(elem).find(".fb-thumbview").show();
			$(elem).find(".fb-tree").hide();
			$(this).prop("disabled",true);
			$(elem).find(".btn-treeview").prop("disabled",false);
			$(this).tooltipster('hide');
		});

		$strbtn = $("<button class='btn btn-primary btn-sm dropdown-toggle' data-toggle='dropdown' style='border-top-right-radius: 0px; border-bottom-right-radius: 0px;'><span class='glyphicon glyphicon-file'></span> New</button>");
		$strul = $("<ul class='dropdown-menu'></ul>");

		$strli = $("<li><a href=\"#\">File</a></li>");
		$strli.appendTo($strul);
		$strli.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"NewFile"},$strbtn);
		});

		$strli = $("<li class='divider'></li>");
		$strli.appendTo($strul);

		$strli = $("<li><a href=\"#\">Folder</a></li>");
		$strli.appendTo($strul);
		$strli.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"NewFolder"},$strbtn);
		});

		$strbtn.appendTo($strbtngrp);
		$strul.appendTo($strbtngrp);

		$strbtn = $("<button class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-pencil'></span> Rename</button>");
		$strbtn.appendTo($strbtngrp);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Rename"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-trash'></span> Delete</button>");
		$strbtn.appendTo($strbtngrp);
		$strbtn.click(function(){			
				methodsFB.ActionRequest(elem,options,{action:"Delete"},$strbtn);   
		})

		$strbtn = $("<button class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-cog'></span> Permission</button>");
		$strbtn.appendTo($strbtngrp);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Permission"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-cloud-upload'></span> Upload</button>");
		$strbtn.appendTo($strbtngrp);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Upload"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-cloud-download'></span> Download</button>");
		$strbtn.appendTo($strbtngrp);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Download"},$strbtn);
		})

		$strcontbtn.appendTo($strprebtn);

		strpresearch = "<div class='col-md-3 fb-pre'></div>";
		$strpresearch = $(strpresearch);
		$strpresearch.appendTo($strscroller);

		strsearch = "<div class='col-md-12'><label class='col-md-3 label-title'>Search</label><div class='col-md-8'><input class='form-control input-sm fb-txt-search' placeholder='folder,file name, etc..'></input></div><div class='col-md-1'><button class='btn btn-sm btn-primary fb-search'><span unselectable='on' class='glyphicon glyphicon-search'></span></button></div></div>"
		$strsearch = $(strsearch); 
		$strsearch.appendTo($strpresearch);

		$($strsearch.find("button")).click(function(){
				methodsFB.ActionRequest(elem,options,{action:"Search"},this);
				app.miniloader(true);
		});

		$($(elem).find(".fb-server")).kendoDropDownList({
			dataSource : options.serverSource.data,
			dataTextField: options.serverSource.dataTextField,
			dataValueField:options.serverSource.dataValueField,
			change: function(){
					app.miniloader(true);
					serverId = this.value();
            		$($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
					$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
					methodsFB.ThumbnailView(elem,options,{serverId: this.value(), path:null});

			}
		});

		$strpretree = $("<div class='col-md-12'></div>");
		$strpretree.appendTo($strcont);

		strtree = "<div class='fb-tree'></div>"
		$strtree = $(strtree);
		$strtree.appendTo($strpretree);


		$strprethumb = $("<div class='col-md-12'></div>");
		$strprethumb.appendTo($strcont);

		$strthumb = $("<div class='fb-thumbview col-md-12'></div>");
		$strthumb.appendTo($strprethumb);

		var ds = options.dataSource;
		var url = methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction);
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.dataSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}


		var datatree = new kendo.data.HierarchicalDataSource({
	        transport: {
	            read: {
	                url: url,
	                dataType: "json",
	                type: call,
	                complete: function(){
	                	$(elem).data("ecFileBrowser").dataSource.GetDirAction = "GetDir";
	                	$strtree.find("span").each(function(){
							if($(this).html()!=""){
								if($($(this).find("span")).length==0){
									var type = methodsFB.DetectType(this,$(this).html(),elem);
									var sp = "<span class='k-sprite "+type+"'></span>";
									$sp = $(sp);
									$sp.prependTo($(this));

									if(type!="folder"){
										$(this).dblclick(function(){
											methodsFB.ActionRequest(elem,options,{action:"GetContent"},this);
										});
									}
								}
							}
						});
						if($(elem).data("ecFileBrowser").isHold){
							methodsFB.AfterCreateNewFile(elem,$(elem).data("ecFileBrowser").Content);
				         }else{
				            app.miniloader(true);
				         }
	                },
	            },
	            parameterMap:function(data,type){
	            	if(type=="read"){
	            		var dt = data;
	            		 
	            		dt["action"] = $(elem).data("ecFileBrowser").dataSource.GetDirAction;
	            		if (dt["action"]=="GetDir"){
	            			dt["serverId"] = $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value();
	            			dt["search"] = $($(elem).find(".fb-txt-search")).val();
	            		}else{
	            			//dt["search"] = $($(elem).find(".fb-txt-search")).val();
	            		}

	            		return dt
	            	}
	            }
	        },
	        schema: {
	        	data: "data",
	            model: {
	                id: options.dataSource.pathField,
	                hasChildren: options.dataSource.hasChildrenField,

	            }
	        }
	    });

		$strtree.kendoTreeView({
			template: templatetree,
			dataSource: datatree,
			dataTextField: options.dataSource.nameField
		});		
		$(elem).find(".fb-thumbview").hide();
		methodsFB.ThumbnailView(elem,options,{serverId: serverId, path:null});
		methodsFB.BuildEditor(elem,options);
		methodsFB.BuildPopUp(elem,options);		
	},
	SetUrl:function(elem,action){
		$(elem).data("ecFileBrowser").dataSource.url = $(elem).data("ecFileBrowser").dataSource.originUrl + "/"+action.toLowerCase();
		return $(elem).data("ecFileBrowser").dataSource.url;
	},

	ThumbnailView: function(elem,options,data){
		var ds = options.dataSource;
		var url = methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction);
		var call = ds.call;
		var serverId =  $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value();
		data.serverId = (data.serverId === '' ? serverId : data.serverId);

		var dt = {
			action : $(elem).data("ecFileBrowser").dataSource.GetDirAction,
			search	: $($(elem).find(".fb-txt-search")).val(),
			serverId : data.serverId,
			path: data.path
		}

		$strthumb = $(elem).find(".fb-thumbview");
		$breadcrumbs = $('<ol class="breadcrumb"></ol>');

		$.ajax({
	        url: url,
			type: call,
			dataType: 'json',
			data: dt,
			async:false,
			success: function(res){
				$strthumb.empty();
				var results = res.data;

				$breadcrumbs.appendTo($strthumb);
		        $libreadcrumbs = $('<li><a href="#"><span class="glyphicon glyphicon-home" home></span></a></li>');
		        $libreadcrumbs.appendTo($breadcrumbs);

		        $strthumb.find("span[home]").click(function(e){
		        	methodsFB.ThumbnailView(elem,options,{serverId: data.serverId, path:null});
		        });

		        if(data.path !== null){
		        	var newPathname = "";
		        	var pathData = [];
		        	var parrentId = "";
		        	var pathArray = data.path.split( '/' );
					for (i = 1; i < pathArray.length; i++) {
					  newPathname += "/";
  					  newPathname += pathArray[i];
  					  pathData.push(newPathname);
		        	  if(i === (pathArray.length - 1)){
		        	  	 $libreadcrumbs = $('<li class="active">'+pathArray[i]+'</li>');
		        	  	 $libreadcrumbs.appendTo($breadcrumbs);
		        	  }else{
		        	  	$libreadcrumbs = $('<li><a href="#" path="'+newPathname+'">'+pathArray[i]+'</a></li>');
		        	  	$libreadcrumbs.appendTo($breadcrumbs);
		        	  	$libreadcrumbs.click(function(){
		        	  		var path = $(this).find("a").attr("path");
							methodsFB.ThumbnailView(elem,options,{serverId: data.serverId, path: path});
						});
		        	  }
		        	  parrentId = "/"+ pathArray[1];
					}
		        }

		        if(results !== null){
		            $.each(results, function(index) {
		            	var id = $.now();
		            	var ico = (results[index].isdir == true ? '<img class="thumb-icon" src="/res/img/folder.png">':'<img class="thumb-icon" src="/res/img/file.png">');
			            var shortName = (results[index].name.length > 5 ? $.trim(results[index].name).substring(0, 9) + ".." : results[index].name);
			            $strprecont = $('<div class="col-xs-2 col-md-1 fb-thumb">'+
			            					'<a href="#" id="'+id+'-'+index+'" name="'+results[index].name+'" permission="'+results[index].permissions+'" path="'+results[index].path+'" isdir='+results[index].isdir+' iseditable='+results[index].iseditable+' class="thumbnail tooltipster" title="'+results[index].name+'">'+
			            						ico +
			            						'<div class="caption" >'+
			            							'<p align="center">'+shortName+'</p>'+
			            						 '</div>'+
			            					'</a>'+
			            				'</div>');
						$strprecont.appendTo($strthumb);
						
						$strprecont.click(function(e){
						   $strthumb.find("a").removeClass("thumb-selected");
						   $(this).find("a").addClass("thumb-selected");
					       return false; // disable single click
					    }).dblclick(function(e){
					    	$strprecont.find("a").removeClass("thumb-selected");
					    	if(results[index].isdir == true){
					    		methodsFB.ThumbnailView(elem,options,{serverId: data.serverId, path:results[index].path});
					    	}else{
					    		var path = $(this).find('a').attr("path");
					    		$(this).find("a").addClass("thumb-selected");
					    		methodsFB.ActionRequest(elem,options,{action:"GetContent",path:path});
					    	}
					       
					    })

					});
		        }else{
		        	$strprecont = $('<div class="alert alert-info" role="alert"> <strong>This folder is empty</strong></div>');
					$strprecont.appendTo($strthumb);
		        }
			}
	    });
	},
	BuildEditor:function(elem,options){
		var $ox = $(elem), $container = $ox.parent(), idLookup = $ox.attr('id');
		var data = options.dataSource.data;

		$div = $("<div class='modal fade modal-fb-editor' tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false'></div>");
		$div.appendTo($(elem));

		$divmod = $("<div class='modal-dialog dialog-editor'></div>");
		$divmod.appendTo($div);

		$divcont = $("<div class='modal-content dialog-content'></div>");
		$divcont.appendTo($divmod);

		$divbody = $("<div class='modal-body'></div>");
		$divbody.appendTo($divcont);

		strpre = "<div class='col-md-12 fb-pre'></div>";
		$strpre = $(strpre);
		$strpre.appendTo($divbody);

		streditor = "<div class='col-md-12'><textarea class='fb-editor'></textarea></div>"
		$streditor = $(streditor);

		$streditor.appendTo($strpre);
		$($(elem).find(".fb-editor")).kendoEditor({ resizable: {
                        content: true,
                        toolbar: true,
                    }});

		$conted = $($(elem).find("ul[data-role='editortoolbar']"));

		$edli = $("<li class='k-tool-group k-button-group pull-right' role='presentation'></li>");
		$edhref = $("<a href='' role='button' class='k-tool k-group-start k-group-end tooltipster fb-ed-btn-cancel' unselectable='on' title='Cancel' aria-pressed='false'></a>");
		$edspan = $("<span unselectable='on' class='glyphicon glyphicon-remove'></span>");
		$edlbl = $("<span class='k-tool-text'>Cancel</span>");

		$edli.appendTo($conted);
		$edhref.appendTo($edli);
		$edspan.appendTo($edhref);
		$edlbl.appendTo($edhref);

		$edhref.click(function(){
			methodsFB.ActionRequest(elem,options,{"action":"Cancel"});
		});

		$edli = $("<li class='k-tool-group k-button-group pull-right' role='presentation'></li>");
		$edhref = $("<a href='' role='button' class='k-tool k-group-start k-group-end fb-ed-btn tooltipster' unselectable='on' title='Save' aria-pressed='false'></a>");
		$edspan = $("<span unselectable='on' class='glyphicon glyphicon-floppy-disk'></span>");
		$edlbl = $("<span class='k-tool-text'>Save</span>");

		$edli.appendTo($conted);
		$edhref.appendTo($edli);
		$edspan.appendTo($edhref);
		$edlbl.appendTo($edhref);

		$edhref.click(function(){
			var path = $(elem).find(".k-editor-toolbar").find(".fb-filename").html();
			methodsFB.ActionRequest(elem,options,{"action":"Edit","path":path});
		});

		$edli = $("<li class='k-tool-group k-button-group' role='presentation'></li>");
		$edtxt = $("<label class='fb-filename'></label>");

		$edli.appendTo($conted);
		$edtxt.appendTo($edli);
		app.prepareTooltipster();


		$conted.find(".k-overflow-tools").attr("style","display:none");
		hei = screen.height*0.7;
		$($(elem).find(".k-editor")).attr("style","height:"+hei+"px");
	},
	BuildPermission:function(elemarr,permstr){
		var idx = 0;
		$(elemarr).each(function(){
			$($(this).find("input")).each(function(){
				if(permstr.charAt(idx)!="-"){
					$(this)[0].checked = true;
				}
				idx++;
			});
		});
	},
	BuildPopUp : function(elem,options){
		$div = $("<div class='modal fade modal-fb' tabindex='-1' role='dialog' data-backdrop='static' data-keyboard='false'></div>");
		$div.appendTo($(elem));

		$divmod = $("<div class='modal-dialog modalcustom'></div>");
		$divmod.appendTo($div);

		$divcont = $("<div class='modal-content'></div>");
		$divcont.appendTo($divmod);

		$divhead = $("<div class='modal-header'>"+
					"<h4 class='modal-title'>"+
					"</h4>"+
					"</div>");
		$divhead.appendTo($divcont);

		$divbody = $("<div class='modal-body'></div>");
		$divbody.appendTo($divcont);

		$divfooter = $("<div class='modal-footer'>"+
					"<button type='button' class='btn btn-sm btn-danger' data-dismiss='modal'>"+
					"<span class='glyphicon glyphicon-repeat'></span> Cancel"+
					"</button>"+
					"<button type='button' class='btn btn-sm btn-primary fb-submit' >"+
					"<span class='glyphicon glyphicon-floppy-disk'></span> Submit"+
					"</button>"+
			"</div>");
		$divfooter.appendTo($divcont);
	},
	CallPopUp:function(elem,content,title){
		$($(elem).find("h4")).html(title);
		$body =	$($(elem).find(".modal-fb")).find(".modal-body");
		$btn =	$($(elem).find(".fb-submit"));
		$btn.unbind("click");
		$body.html("");
		if($($(elem).find(".thumb-selected")).length > 0){
			var name = $($(elem).find(".thumb-selected")).attr("name");
		}else{
			var name = $($($(elem).find(".k-state-selected")).find("a")).attr("name");
		}
		var type = methodsFB.DetectType($(elem).find(".k-state-selected"),name,elem);

		if(content.action=="NewFile"){
			if (type!="folder"){
                swal("Warning!", "Please choose folder !", "warning");
				return;
			}

			$divNewFile = $("<div class='col-md-12'>"+
				"<div class='col-md-12 btn-cont'>"+
				"<div class='col-md-2'><label class='filter-label'>File Type</label></div>"+
				"<div class='col-md-10'><input class='fb-ddl-filetype'></input></div>"+
				"</div>"+
				"<div class='col-md-12'>"+
				"<div class='col-md-2'><label class='filter-label'>File Name</label></div>"+
				"<div class='col-md-9'><input placeholder='Type File Name ..' class='form-control input-sm'></input></div>"+
				"</div>"+
				"</div>");
			$divNewFile.appendTo($body);
			var filetype=["csv","json","xml","txt"];
			$(elem).find(".fb-ddl-filetype").kendoDropDownList({
				dataSource : filetype
			});
			$btn.click(function(){
					if ((content.path).substr((content.path).length - 1, 1) != "/") {
						content.path = content.path + "/"
					}
					content.path = content.path	+ $($body.find(".form-control")).val() +"."+ $($(elem).find("input[class='fb-ddl-filetype']")).getKendoDropDownList().value();
					methodsFB.SendActionRequest(elem,content);
			});
		}else if(content.action=="NewFolder"){
			if (type!="folder"){
                swal("Warning!", "Please choose folder !", "warning");
				return;
			}

			$divNewFile = $("<div class='col-md-12'>"+
				
				"<div class='col-md-2'><label class='filter-label'>Folder Name</label></div>"+
				"<div class='col-md-9'><input placeholder='Type Folder Name ..' class='form-control input-sm'></input></div>"+
				"</div>");
			$divNewFile.appendTo($body);
			$btn.click(function(){
					if ((content.path).substr((content.path).length - 1, 1) != "/") {
						content.path = content.path + "/"
					}
					content.path = content.path	+ $($body.find("input")).val();
					methodsFB.SendActionRequest(elem,content);
			});
		}else if(content.action=="Rename"){
			var lbl = "File"
			if(type	=="folder"){
				lbl = "Folder";
			    $($(elem).find("h4")).html(lbl + " Name");
			}

			$divNewFile = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>" +lbl+ " Name</label></div><div class='col-md-9'><input placeholder='Type "+lbl+" Name ..' class='form-control input-sm'></input></div></div>");
			$($divNewFile.find("input")).val(name);
			$divNewFile.appendTo($body);

			$btn.click(function(){
					content.newname = $($body.find("input")).val();
					methodsFB.SendActionRequest(elem,content);
			});		
		}else if (content.action=="Permission"){
			$divperm = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>Permission</label></div>"+
					"<div class='col-md-3'><label class='perm-label'>Owner</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"<div class='col-md-3'><label class='perm-label'>Group Member</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"<div class='col-md-3'><label class='perm-label'>All User</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"</div>");
			$divperm.appendTo($body);

			$btn.click(function(){
					var strperm = "";
					var arr = ["r","w","x"];
					$($body.find(".col-md-3")).each(function(){
						$($(this).find("input")).each(function(i){
								if($(this)[0].checked){
									strperm	+= arr[i];
								}else{
									strperm	+="-";
								}
						});
					});
					content.permission = strperm;
					methodsFB.SendActionRequest(elem,content);
			});	

			if($($(elem).find(".thumb-selected")).length > 0){
				methodsFB.BuildPermission($($body.find(".col-md-3")),$($(elem).find(".thumb-selected")).attr("permission"));
			}else{
				methodsFB.BuildPermission($($body.find(".col-md-3")),$($($(elem).find(".k-state-selected")).find("a")).attr("permission"));
			}
			
		}else if (content.action=="Upload"){
			if (type!="folder"){
                swal("Warning!", "Please choose folder !", "warning");
				return;
			}

			$form =	$("<form class='form-signin' method='post' action='/Test/Upload' enctype='multipart/form-data'></form>");
			$fs =	$("<fieldset></fieldset>");
			$inp =	$("<div class='col-md-3'><label class='filter-label'>Upload File</label></div><div class='col-md-9'><input type='file' name='myfiles' id='myfiles' multiple='multiple'></div>");

			$form.appendTo($body);
			$fs.appendTo($form);
			$inp.appendTo($fs);	

			$btn.click(function(){
				// content.file = $($body.find("input")).val();
				methodsFB.SendActionRequest(elem,content);
			});
		}
		$body.find("input").each(function(){
				$(this).keydown(function(e){
				    if (e.which === 32) {
				        e.preventDefault();      
				    }
				}).blur(function() {
				    // for variety's sake here's another way to remove the spaces:
				    $(this).val(function(i,oldVal){ return oldVal.replace(/\s/g,''); });         
				});
		});

		$($(elem).find(".modal-fb")).modal("show");	

	},
	ActionRequest:function(elem,options,content,sender){
		if(!$(elem).data("ecFileBrowser").isHold && (content.action=="Edit"||content.action=="Cancel")){
			$(elem).find(".modal-fb-editor").modal("hide");
			return;
		}

		if($(elem).data("ecFileBrowser").isHold && content.action!="GetContent"){
			if(content.action=="Edit" || content.action=="Cancel"){
				 $(elem).find(".modal-fb-editor").modal("hide");
			}else{
           		 swal("Warning!", "Please finish editing file !", "warning");
				return;
			}
		}

		//var SelectedPath = $($(elem).find(".k-state-selected")).length > 0 ?  $($($(elem).find(".k-state-selected")).find("a")).attr("path"):"";
		var SelectedTree = $($(elem).find(".k-state-selected")).length > 0 ?  $($($(elem).find(".k-state-selected")).find("a")).attr("path"):"";
		var SelectedFile = $($(elem).find(".thumb-selected")).length > 0 ? $($(elem).find(".thumb-selected")).attr("path") : "";
		var SelectedPath = (SelectedFile !== "" ? SelectedFile : SelectedTree);

		var name = "";
		var type = "";
		var permiss = "";

		if( SelectedPath == ""  && content.action!="Cancel" && content.action!="GetContent" && content.action!="Search"){
            swal("Warning!", "Please choose folder or file !", "warning");
			return;
		}


		if(content.action!="Search"){
			name  = (SelectedFile !== "" ? $($(elem).find(".thumb-selected")).attr("name") : $($($(elem).find(".k-state-selected")).find("a")).attr("name"));
			permiss = (SelectedFile !== "" ? $($(elem).find(".thumb-selected")).attr("permission") : $($($(elem).find(".k-state-selected")).find("a")).attr("permission"));
			type = methodsFB.DetectType($(elem).find(".k-state-selected"),name,elem);
		}

		if(content.action=="Rename"||content.action=="Delete"||content.action=="Permission"){
			if($($(elem).find(".thumb-selected")).length > 0){
				var iseditable = JSON.parse($($(elem).find(".thumb-selected")).attr("iseditable"));
			}else{
				var dtitm = methodsFB.GetSelectedData(elem);
				var iseditable = dtitm.iseditable
			}
			
			if(!iseditable){
				return;
			}
		}

		
		if(content.action=="Cancel"){
			$($(elem).find(".fb-filename")).html("");
			$($(elem).find(".fb-editor")).data("kendoEditor").value("");
			return;
		}else if(content.action=="GetContent"){
			var path = $($(sender).find("a")).attr("path");
			content.path = (content.path == null ? path : content.path);
			methodsFB.SetUrl(elem,content.action);
			if($(elem).data("ecFileBrowser").isHold){
					var divtree = $($(elem).find(".fb-pre")[0]);
					$($(elem).find(".fb-filename")).html(content.path);
					$($(elem).find(".fb-editor")).data("kendoEditor").value("");
					$($(elem).find(".fb-editor")).data("kendoEditor").focus();
                	app.miniloader(false);
                	divtree.css("pointer-events", "none");
                	divtree.addClass("k-state-disabled");
                	return;
			}
		}else if(content.action=="Rename"){
			content.path = SelectedPath;
			methodsFB.CallPopUp(elem,content,"Rename File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="NewFile"){
			content.path = SelectedPath;
			methodsFB.CallPopUp(elem,content,"Create New File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="NewFolder"){
			content.path = SelectedPath;
			methodsFB.CallPopUp(elem,content,"Create New Folder");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Delete"){
			content.path = SelectedPath;
			methodsFB.SetUrl(elem,content.action);
		}else if(content.action=="Permission"){
			content.path = SelectedPath;
			methodsFB.CallPopUp(elem,content,"Edit Permission");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Upload"){
			content.path = SelectedPath;
			methodsFB.CallPopUp(elem,content,"Upload File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Edit"){
			content.contents = $($(elem).find(".fb-editor")).getKendoEditor().value();
			content.permission = permiss;
			methodsFB.SetUrl(elem,content.action);
		}else if(content.action=="Search"){
			$(elem).data("ecFileBrowser").dataSource.GetDirAction = "GetDir";
            $($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
			$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
			methodsFB.ThumbnailView(elem, options,{serverId: $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value(), path:null});
			return;
		}else if(content.action=="Download"){
			content.path = SelectedPath;
			if (type=="folder"){
            	swal("Warning!", "Please choose file !", "warning");
				return;
			}
			methodsFB.SetUrl(elem,content.action);
		}

		if (content.action=="Delete"){
			 swal({
			    title: "Are you sure?",
			    text: "You will delete this "+(type=="folder"?"folder":"file"),
			    type: "warning",
			    showCancelButton: true,
			    confirmButtonText: "Yes",
			    cancelButtonText: "No",
			    closeOnConfirm: true,
			    closeOnCancel: true
			  },
			  function(isConfirm){
			    if (isConfirm) {
					methodsFB.SendActionRequest(elem,content);
				} 
			  });
		}else if(content.action == "GetContent"){
			methodsFB.SendActionRequest(elem,content);
			app.miniloader(true);
			$($(elem).find(".modal-fb-editor")).modal("show");
		}else{
			content.path = (content.path !== null ? content.path : SelectedPath);
			methodsFB.SendActionRequest(elem,content);
		}
		$(elem).find(".modal-fb-editor").on('hide.bs.modal', function(e) {
			var divtree = $($(elem).find(".fb-pre")[0]);
	        divtree.removeAttr("style");
	        divtree.removeClass("k-state-disabled");
			$(elem).data("ecFileBrowser").isHold = false;
		});
	},
	UploadAjax: function(elem,param){
       	var inputFiles = document.getElementById("myfiles");
       	var formdata = new FormData();

       	for (i = 0; i < inputFiles.files.length; i++) {
            formdata.append('myfiles', inputFiles.files[i]);
            formdata.append('filetypes', inputFiles.files[i].type);
            formdata.append('filesizes', inputFiles.files[i].size);
            formdata.append('filename', inputFiles.files[i].name);
        }
       
        formdata.append('path', param.path);
        formdata.append('serverId', param.serverId);

        app.miniloader(true);

       	var xhr = new XMLHttpRequest();
        xhr.open('POST', param.url); 
        xhr.send(formdata);
        xhr.onreadystatechange = function () {
            /*if (xhr.readyState == 4 && xhr.status == 200) {
                alert(xhr.responseText);
            }
*/
            app.miniloader(false);
            $(elem).find(".modal-fb").modal("hide");
            methodsFB.RefreshTreeView(elem,param);
           methodsFB.ThumbnailView(elem, $(elem).data("ecFileBrowser"),{serverId: param.serverId, path:param.path});
	        swal("Saved!", "Your request has been processed !", "success");
        }
        

        return false;
	},
	HandleError: function (res) {
		if (!res.success) {
    		if (typeof sweetAlert !== "undefined") {
				sweetAlert("Oops...", res.message, "error");
    		} else {
    			alert("ERROR: " + res.message);
    		}

    		return false;
    	}

    	return true;
	},
	SendActionRequest:function(elem,param){
		param.serverId = $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value();
		
		var ds = $(elem).data("ecFileBrowser").dataSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		app.miniloader(true);

		var parentDir = (param.path).substring((param.path).indexOf('/'), (param.path).lastIndexOf('/'));

		if (param.action == "Download") {
			var arr = [];
			for (var k in param) {
				if (param.hasOwnProperty(k)) {
					arr.push([k, encodeURIComponent(param[k])].join("="));
				}
			}
			var url = [url.split('#')[0], arr.join("&")].join("?");
			document.location.href = url;
			setTimeout(function(){ app.miniloader(true); },5000);
		} else if (param.action == "Upload") {
			param.url = url;
			methodsFB.UploadAjax(elem,param);
		}else{
		if (ds.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}

		 $.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : JSON.stringify(param),
                contentType: contentType,
                success : function(res) {
                	methodsFB.HandleError(res);
                	var divtree = $($(elem).find(".fb-pre")[0]);
                	divtree.removeAttr("style");
                	divtree.removeClass("k-state-disabled");
            		app.miniloader(false);

                	$(elem).data('ecFileBrowser').serverSource.callOK(res);
                	if(param.action == "GetContent"){
                		$($(elem).find(".fb-filename")).html(param.path);
						$($(elem).find(".fb-editor")).data("kendoEditor").value(res.data);
						$($(elem).find(".fb-editor")).data("kendoEditor").focus();
						$(elem).data("ecFileBrowser").isHold = true;
                		app.miniloader(false);
                		divtree.css("pointer-events", "none");
                		divtree.addClass("k-state-disabled");

                	}else if(param.action!="Edit"){
                		if($($(elem).find(".thumb-selected")).length > 0){
                			methodsFB.ThumbnailView(elem, $(elem).data("ecFileBrowser"),{serverId: param.serverId, path:parentDir});
                		}else{
                			methodsFB.RefreshTreeView(elem,param);
                		}

                	}else  if(param.action=="Edit") {
                		$($(elem).find(".fb-filename")).html("");
						$($(elem).find(".fb-editor")).data("kendoEditor").value("");

                	}

                	$(elem).find(".modal-fb").modal("hide");
                	if(param.action=="Delete"){
                		swal({title: "File / Folder successfully deleted", type: "success"});	
                	}

                	if(param.action=="NewFile"){
						$(elem).data("ecFileBrowser").Content = param;
						methodsFB.ActionRequest(elem,$(elem).data("ecFileBrowser"),{action:"GetContent",path:param.path});
						return;
	               	}
	               	
                	if(!$(elem).data("ecFileBrowser").isHold){
                		swal("Saved!", "Your request has been processed !", "success");
                		$(elem).find(".modal-fb-editor").modal("hide");
                		app.miniloader(false);
                	}
                },
                error: function (a, b, c) {
                	app.miniloader(false);
					$(elem).data('ecFileBrowser').dataSource.callFail(a,b,c);
                	divtree.removeClass("k-state-disabled");
				},
	        });
		}
	},
	AfterCreateNewFile:function(elem,content){
		var tree = $($(elem).find(".k-treeview")).getKendoTreeView();
		var name = content.path.split('/')[content.path.split('/').length-1];
		setTimeout(function(){
			$($($($(elem).find(".k-treeview").find("a[name='"+ name +"']")).parentsUntil("li"))[0]).click().dblclick();
		},1000);
	},
	CallAjaxServer:function(elem,options){
		var ds = options.serverSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.serverSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		$.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : data,
                contentType: contentType,
                success : function(res) {
                	methodsFB.HandleError(res);
                	$(elem).data('ecFileBrowser').serverSource.callOK(res);
					options.serverSource.data = res.data;
					$(elem).data("ecFileBrowser", options);
					if($(elem).html()!=""){
						var parent = $($($(elem).find(".fb-server")).parent()[0]);
						$($(elem).find(".fb-server")).remove();

						strserv = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label'>Server</label></div><div class='col-md-9'><input class='fb-server'></input></div></div>";
						$strserv = $(strserv);
						$strserv.appendTo($(parent));

						$($(elem).find(".fb-server")).kendoDropDownList({
							dataSource : options.serverSource.data,
							dataTextField: options.serverSource.dataTextField,
							dataValueField:options.serverSource.dataValueField,
							change: function(){
            		 			$($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
								$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
							}
						});					
					}else{
						methodsFB.BuildFileExplorer(elem, options);
					}
                },
                error: function (a, b, c) {
					$(elem).data('ecFileBrowser').serverSource.callFail(a,b,c);
			},
        });
	},
	DetectType:function(elem,name,elemmain){
		name = name.toLowerCase();
		var isdir;
		var childcount;
		if($($(elemmain).find(".thumb-selected")).length > 0){
			isdir = $($(elemmain).find(".thumb-selected")).attr("isdir");
		}
		else{
			var childcount = $(elem).prev("span").length
			var tree = $($(elemmain).find(".k-treeview")).getKendoTreeView();
			$li = $(elem).closest("li");
			isdir = tree.dataItem($li).isdir;
		}

		if (childcount > 0|| isdir == true || isdir == "true"){
			return "folder"
		}else if (name.indexOf(".pdf")>-1){
			return "pdf"
		}else if (name.indexOf(".png")>-1||name.indexOf(".jpg")>-1||name.indexOf(".jpeg")>-1||name.indexOf(".gif")>-1||name.indexOf(".tiff")>-1||name.indexOf(".bmp")>-1){
			return "image"
		}else {
			return "html"
		}
	},
	GetParent:function(elem,content){
		var tree = $($(elem).find(".k-treeview")).getKendoTreeView();
		var selectedUid = $($($($(elem).find(".k-state-selected")).parentsUntil("li")).parent()).attr("data-uid");
		var selectedparent = tree.findByUid(selectedUid);
		var action = content.action.toLowerCase();
		if(action != "newfile" && action != "newfolder" && action != "upload"){
			selectedparent = tree.parent(selectedparent);
		}
		return selectedparent;
	},
	RefreshTreeView:function(elem,content){
		var tree = $($(elem).find(".k-treeview")).getKendoTreeView();
		var selectedparent = methodsFB.GetParent(elem,content);
		if(selectedparent.length==0){
			// setTimeout(function(){
				app.miniloader(false);
			// },500);
			tree.dataSource.read();
			return;
		}

		var dtItem = tree.dataItem(selectedparent);
		dtItem.set("expanded",false);
		dtItem.loaded(false);
		
		setTimeout(function () {
			dtItem.set("expanded",true);
		}, 1500);
			
	},
	GetSelectedData:function(elem){
		var tree = $($(elem).find(".k-treeview")).getKendoTreeView();
		var selectedUid = $($($($(elem).find(".k-state-selected")).parentsUntil("li")).parent()).attr("data-uid");
		var dataItem = tree.dataItem(tree.findByUid(selectedUid));
		return dataItem;
	},
}
