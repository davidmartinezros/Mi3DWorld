import { Component } from '@angular/core';

import { Http, Response } from '@angular/http';

declare var GL;
declare var vec3;
declare var mat4;
declare var DEG2RAD;
declare var Raytracer, BBox, Shader;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  data: any;

  constructor(private http: Http) {
	  this.getJsonFile("./assets/data.json");
  }

  getJsonFile(urlJson: string) {
	this.http.get(urlJson)
		.subscribe(
			data => this.data = data.json(),
			err => this.handleError,
			() => { this.init(this.data);}
		);
  }

  private handleError(error: any): Promise<any> {
	console.error('An error occurred', error); // for demo purposes only
	return Promise.reject(error.message || error);
  }

  init(data:any) {

		//create the rendering context
		var container = document.body;

		var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
		container.appendChild(gl.canvas);
		gl.animate();

		//build the mesh
		var cube_mesh = GL.Mesh.cube({size:10});
		var cam_pos = vec3.fromValues(0,0,200);

		//create basic matrices for cameras and transformation
		var projection = /*window.persp = */mat4.create();
		var view = /*window.view = */mat4.create();
		var mvp = /*window.mvp = */mat4.create();
		var temp = mat4.create();

		var objects = [];

		for(var i = 0; i < data.length; i++) {
			var o = data[i];
			objects.push({ color: [o.colorR,o.colorG,o.colorB,o.colorAlpha], model: mat4.translationMatrix( [o.posX*12,o.posY*12,0] ), mesh: cube_mesh });
		}
/*
		for(var x = -10; x <= 10; x++)
			for(var y = -5; y <= 5; y++)
				objects.push({ color: [0.3,0.3,0.3,1.0], model: mat4.translationMatrix( [x*12,y*12,0] ), mesh: cube_mesh });
*/
		//set the camera perspective
		mat4.perspective( projection, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		//mat4.ortho(persp, -50,50,-50,50,0,500); //ray doesnt work in perspective

		function getClosestObject(x,y)
		{
			mat4.multiply( mvp, projection, view );
			var RT = new GL.Raytracer( mvp );
			var ray = RT.getRayForPixel(x,y);

			var closest_object = null;
			var closest_t = 100000000;

			for(var i in objects)
			{
				var object = objects[i];

				var result = Raytracer.hitTestBox( cam_pos, ray, BBox.getMin(object.mesh.bounding), BBox.getMax(object.mesh.bounding), object.model );
				if(result && closest_t > result.t)
				{
					closest_object = object;
					closest_t = result.t;
				}
			}
			return closest_object;
		}

		gl.captureMouse();
		gl.onmousemove = function(e) {
			var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
			if(object && object.color[0] != 1) {
				vec3.random( object.color );
			}
		}
		gl.onmousedown = function(e) {
			var object = getClosestObject(e.canvasx, gl.canvas.height - e.canvasy);
			if(object) {
				console.log(object.model);
				object.model = mat4.translationMatrix( [object.model[12],object.model[13],object.model[14] + 50] );
				console.log(object.model);
				cam_pos[0] = object.model[12];
				cam_pos[1] = object.model[13];
				cam_pos[2] = object.model[14] + 50;
			}
		}
		gl.onmousewheel = function(e) {
			console.log("wheel");
			cam_pos[2] = cam_pos[2] - 5;
		}
		//basic phong shader
		var shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_normal;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				uniform vec3 u_lightvector;\
				uniform vec4 u_color;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  gl_FragColor = u_color * max(0.0, dot(u_lightvector,N));\
				}\
			');


		//generic gl flags and settings
		gl.clearColor(0.01,0.01,0.01,1);
		gl.enable( gl.DEPTH_TEST );
		gl.enable( gl.CULL_FACE );

		var modelt = mat4.create();

		//rendering loop
		gl.ondraw = function()
		{
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
			var L = vec3.normalize(vec3.create(),[1.5,1.1,1.4]);
			mat4.lookAt(view, cam_pos, [0,0,0], [0,1,0]);

			//create modelview and projection matrices
			for(var i in objects)
			{
				var model = objects[i].model;

				mat4.multiply(temp,view,model); //modelview
				mat4.multiply(mvp,projection,temp); //modelviewprojection

				//render mesh using the shader
				shader.uniforms({
					u_color: objects[i].color,
					u_lightvector: L,
					u_model: model,
					u_mvp: mvp
				}).draw(objects[i].mesh);
			}
		};

		//update loop
		gl.onupdate = function(dt)
		{
			cam_pos[0] = Math.sin( new Date().getTime() * 0.001 ) * 100;
		};
	}
}
