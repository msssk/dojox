dojo.provide("dojox.html.ext-dojo.style");
dojo.experimental("dojox.html.ext-dojo.style");

// summary: Extensions to dojo.style adding the css3 "transform" and "transform-origin" properties on IE5.5+
// description:
//	A Package to extend the dojo.style function
//	Supported transformation functions:
//  matrix, translate, translateX, translateY, scale, scaleX, scaleY, rotate, skewX, skewY, skew

;(function(d){
	var ds = d.style,
		PI = Math.PI,
		cos = Math.cos,
		sin = Math.sin,
		tan = Math.tan,
		max = Math.max,
		min = Math.min,
		abs = Math.abs,
		attr = d.attr,
		degToRad = PI/180,
		gradToRad = PI/200,
		hasAttr = d.hasAttr,
		dto = "dojo-transform-origin",
		conversion = d.create("div", {
			style: {
				position: "absolute",
				top: "-100px",
				left: "-100px",
				fontSize: 0,
				width: "0",
				backgroundPosition: "50% 50%"
			}
		}),
		_getTransformOrigin = function(node){
			return attr(node, dto) || "50% 50%";
		},
		toPx = function(measure){
            if(measure.toLowerCase().indexOf("px") != -1){
                return measure;
            }
			// "native" conversion in px
            !conversion.parentNode && d.place(conversion, d.body());
			ds(conversion, "margin", measure);
			return ds(conversion, "margin");
		},
		_setTransformOrigin = 
			d.isIE ? function(/*DomNode*/node, /*String*/ transformOrigin){
				var to = d.trim(transformOrigin)
					.replace(" top", " 0")
					.replace("left ", "0 ")
					.replace(" center", "50%")
					.replace("center ", "50% ")
					.replace(" bottom", " 100%")
					.replace("right ", "100% ")
					.replace(/\s+/, " "),
					toAry = to.split(" "),
					n = d.byId(node),
					t = _getTransform(n),
					validOrigin = true
				;
				for(var i = 0; i < toAry.length; i++){
					validOrigin = validOrigin && /^0|(\d+(%|px|pt|in|pc|mm|cm))$/.test(toAry[i]);
					if(toAry[i].indexOf("%") == -1){
						toAry[i] = toPx(toAry[i]);
					}
				}
				if(!validOrigin){
					return;
				}
				if(!toAry.length || toAry.length > 2 ){
					return;
				}
				attr(n, dto, toAry.join(" "));
				t && _setTransform(node, t);
			} :
			d.isFF >= 3.5 && function(/*DomNode*/node, /*String*/ transformOrigin){
				ds(node, "MozTransformOrigin", transformOrigin);
			} ||
			d.isWebKit &&
			function(/*DomNode*/node, /*String*/ transformOrigin){
				ds(node, "WebkitTransformOrigin", transformOrigin);
			}
			||
			function(/*DomNode*/node, /*String*/ transform){

			}
		,
		_getTransform = d.isIE ? function(/*DomNode*/node){
			try{
				var n = d.byId(node),
					item = n.filters.item(0)
				;
				return "matrix(" + item.M11 + ", " + item.M12 + ", " + item.M21 + ", " +
					item.M22 + ", " + (attr(node, "dojo-transform-tx") || "0") + ", " + (attr(node, "dojo-transform-ty") || "0") + ")";
			}catch(e){
				return "matrix(1, 0, 0, 1, 0, 0)";
			}
		} : d.isFF >= 3.5 && function(node){
				return ds(node, "MozTransform");
			} || d.isWebKit && function(/*DomNode*/node){
				return ds(node, "WebkitTransform");
			}
			||
			function(/*DomNode*/node){
			}
		,
		_setTransform =
			d.isIE ? function(/*DomNode*/node, /*String*/ transform){
				var t = transform.replace(/\s/g, ""),
					n = d.byId(node),
					transforms = t.split(")"),
					props = [1, 0, 0, 1, 0, 0],
					toRad = 1,
					toRad1 = 1,
					// current transform
					ct = "",
					currentTransform = "",
					x0 = 0,
					y0 = 0,
					dx = 0,
					dy = 0,
					xc = 0,
					yc = 0,
					a = 0,
					// default transform
					m11 = 1,
					m12 = 0,
					m21 = 0,
					m22 = 1,
					tx = 0,
					ty = 0,
					newPosition = ds(n, "position") == "absolute" ? "absolute" : "relative",
					w = ds(n, "width") + ds(n, "paddingLeft") + ds(n, "paddingRight"),
					h = ds(n, "height") + ds(n, "paddingTop") + ds(n, "paddingBottom")
				;
				// ie8 bug, a filter is applied to positioned descendants
				// only if the parent has z-index
				ds(n, "zIndex") == "auto" && ds(node, "zIndex", "0");

				!hasAttr(n, dto) && _setTransformOrigin(n, "50% 50%");
				for(var i = 0, l = transforms.length; i < l; i++){
					currentTransform = transforms[i];
					if(currentTransform.indexOf("matrix(") == 0){
						ct = currentTransform.replace(/matrix\(|\)/g, "");
						var matrix = ct.split(",");
						m11 = props[0]*matrix[0] + props[1]*matrix[2];
						m12 = props[0]*matrix[1] + props[1]*matrix[3];
						m21 = props[2]*matrix[0] + props[3]*matrix[2];
						m22 = props[2]*matrix[1] + props[3]*matrix[3];
						tx = props[4] + matrix[4];
						ty = props[5] + matrix[5];
					}else if(currentTransform.indexOf("rotate(") == 0){
						ct = currentTransform.replace(/rotate\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						a = parseFloat(ct)*toRad;
						var s = sin(a),
							c = cos(a)
						;
						m11 = props[0]*c + props[1]*s;
						m12 = -props[0]*s + props[1]*c;
						m21 = props[2]*c + props[3]*s;
						m22 = -props[2]*s + props[3]*c;
					}else if(currentTransform.indexOf("skewX(") == 0){
						ct = currentTransform.replace(/skewX\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						var ta = tan(parseFloat(ct)*toRad);
						m11 = props[0];
						m12 = props[0]*ta + props[1];
						m21 = props[2];
						m22 = props[2]*ta + props[3];
					}else if(currentTransform.indexOf("skewY(") == 0){
						ct = currentTransform.replace(/skewY\(|\)/g, "");
						toRad = ct.indexOf("deg") != -1 ? degToRad : ct.indexOf("grad") != -1 ? gradToRad : 1;
						ta = tan(parseFloat(ct)*toRad);
						m11 = props[0] + props[1]*ta;
						m12 = props[1];
						m21 = props[2] + props[3]*ta;
						m22 = props[3];
					}else if(currentTransform.indexOf("skew(") == 0){
						ct = currentTransform.replace(/skew\(|\)/g, "");
						var skewAry = ct.split(",");
						skewAry[1] = skewAry[1] || "0";
						toRad = skewAry[0].indexOf("deg") != -1 ? degToRad : skewAry[0].indexOf("grad") != -1 ? gradToRad : 1;
						toRad1 = skewAry[1].indexOf("deg") != -1 ? degToRad : skewAry[1].indexOf("grad") != -1 ? gradToRad : 1;
						var a0 = tan(parseFloat(skewAry[0])*toRad),
							a1 = tan(parseFloat(skewAry[1])*toRad1)
						;
						m11 = props[0] + props[1]*a1;
						m12 = props[0]*a0 + props[1];
						m21 = props[2]+ props[3]*a1;
						m22 = props[2]*a0 + props[3];
					}else if(currentTransform.indexOf("scaleX(") == 0){
						ct = parseFloat(currentTransform.replace(/scaleX\(|\)/g, "")) || 1;
						m11 = props[0]*ct;
						m12 = props[1];
						m21 = props[2]*ct;
						m22 = props[3];
					}else if(currentTransform.indexOf("scaleY(") == 0){
						ct = parseFloat(currentTransform.replace(/scaleY\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1]*ct;
						m21 = props[2];
						m22 = props[3]*ct;
					}else if(currentTransform.indexOf("scale(") == 0){
						ct = currentTransform.replace(/scale\(|\)/g, "");
						var scaleAry = ct.split(",");
						scaleAry[1] = scaleAry[1] || 1;
						m11 = props[0]*scaleAry[0];
						m12 = props[1]*scaleAry[1];
						m21 = props[2]*scaleAry[0];
						m22 = props[3]*scaleAry[1];
					}else if(currentTransform.indexOf("translateX") == 0){
						ct = parseInt(currentTransform.replace(/translateX\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						tx = toPx(ct);
						tx && attr(n, "dojo-transform-matrix-tx", tx);
					}else if(currentTransform.indexOf("translateY(") == 0){
						ct = parseInt(currentTransform.replace(/translateY\(|\)/g, "")) || 1;
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						ty = toPx(ct);
						ty && attr(n, "dojo-transform-matrix-ty", ty);
					}else if(currentTransform.indexOf("translate(") == 0){
						ct = currentTransform.replace(/translate\(|\)/g, "");
						m11 = props[0];
						m12 = props[1];
						m21 = props[2];
						m22 = props[3];
						var translateAry = ct.split(",");
						translateAry[0] = parseInt(toPx(translateAry[0])) || 0;
						translateAry[1] = parseInt(toPx(translateAry[1])) || 0;
						tx = translateAry[0];
						ty = translateAry[1];
						tx && attr(n, "dojo-transform-matrix-tx", tx);
						ty && attr(n, "dojo-transform-matrix-ty", ty);
					}
					props = [m11, m12, m21, m22, tx, ty];
				}
				// test
				var Bx = min(w*m11 + h*m12, min(min(w*m11, h*m12), 0)),
					By = min(w*m21 + h*m22, min(min(w*m21, h*m22), 0))
				;
				dx = -Bx;
				dy = -By;
				if(d.isIE < 8 && newPosition != "absolute"){
					var parentWidth = ds(node.parentNode, "width"),
						wMax = max(abs(w*m11) + abs(h*m12), max(max(abs(w*m11), abs(h*m12)), 0))
					;
					dx -= (wMax - w) / 2 - (parentWidth > wMax ? 0 : (wMax - parentWidth) / 2);
				}

				n.style.filter =
					"progid:DXImageTransform.Microsoft.Matrix(M11=" + m11 +
					",M12=" + m12 +
					",M21=" + m21 +
					",M22=" + m22 +
//					",FilterType='nearest',Dx=0,Dy=0,sizingMethod='auto expand')"
					",FilterType='bilinear',Dx=0,Dy=0,sizingMethod='auto expand')"
				;
				tx = parseInt(attr(n, "dojo-transform-matrix-tx") || "0");
				ty = parseInt(attr(n, "dojo-transform-matrix-ty") || "0");

				// transform origin
				var toAry = attr(n, dto).split(" ");

				for(i = 0; i < 2; i++){
					toAry[i] = toAry[i] || "50%";
				}
				xc = (toAry[0].toString().indexOf("%") != -1) ? w * parseInt(toAry[0]) * .01 : toAry[0];
				yc = (toAry[1].toString().indexOf("%") != -1) ? h * parseInt(toAry[1]) * .01 : toAry[1];
				if(hasAttr(n, "dojo-startX")){
					x0 = parseInt(attr(n, "dojo-startX"));
				}else{
					x0 = parseInt(ds(n, "left"));
					attr(n, "dojo-startX", newPosition == "absolute" ? x0 : "0");
				}
				if(hasAttr(n, "dojo-startY")){
					y0 = parseInt(attr(n, "dojo-startY"));
				}else{
					y0 = parseInt(ds(n, "top"));
					attr(n, "dojo-startY", newPosition == "absolute" ? y0 : "0");
				}
				ds(n, {
					position: newPosition,
					left: x0 - parseInt(dx) + parseInt(xc) - (parseInt(xc)*m11 + parseInt(yc)*m12) + tx + "px",
					top:  y0 - parseInt(dy) + parseInt(yc) - (parseInt(xc)*m21 + parseInt(yc)*m22) + ty + "px"
				});
			} :
			d.isFF >= 3.5 && function(/*DomNode*/node, /*String*/ transform){
				ds(node, "MozTransform", transform);
			} ||
			d.isWebKit &&
			function(/*DomNode*/node, /*String*/ transform){
				ds(node, "WebkitTransform", transform);
			}
			||
			function(/*DomNode*/node, /*String*/ transform){
			}
	;
	d.style = function(	/*DomNode|String*/ node,
							/*String?|Object?*/ style,
							/*String?*/ value){
		// summary:
		//      extended dojo.style()
		// description:
		//      extended dojo.style() function, capable of handling the css3 "transform" and "transform-origin" properties
		// example:
		// | dojo.style("rotate(20deg) scaleX(1.5) scaleY(2) skew(10deg, 20deg)")
		var n = d.byId(node),
			tr = (style == "transform"),
			to = (style == "transformOrigin"),
			args = arguments.length
		;
		if(args == 3){
			if(tr){
				_setTransform(n, value, true);
			}else if(to){
				_setTransformOrigin(n, value);
			}else{
				ds(node, style, value);
			}
		}
		if(args == 2){
			if(tr){
				return _getTransform(node);
			}else if(to){
				return _getTransformOrigin(node);
			}else{
				return ds(node, style);
			}
		}
	};
})(dojo);
