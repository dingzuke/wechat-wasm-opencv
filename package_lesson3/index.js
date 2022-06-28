
// wasm路径
global.wasm_url = '/assets/opencv3.4.16.wasm.br'
// opencv_exec.js会从global.wasm_url获取wasm路径
let cv = require('../assets/opencv_exec.js');
let listener;

Page({
	// 视频
	cameraCanvas: null,
	faceCascade: null,
	eyeCascade: null,
	cameraData:undefined,

	data: {
	},
	onReady() {
		// 初始化云
		wx.cloud.init({
			env: 'opencv-test',
		})

		// 可见的画布
		this.initCanvas()
	},
	// 获取画布
	initCanvas() {
		var _that = this;
		// 视频
		wx.createSelectorQuery()
			.select('#mycanvas')
			.fields({ node: true, size: true })
			.exec((res) => {
				const cameraCanvas2d = res[0].node;
				// 设置画布的宽度和高度
				cameraCanvas2d.width = res[0].width;
				cameraCanvas2d.height = res[0].height;
				_that.cameraCanvas = cameraCanvas2d
			});	
	},
	// 加载算法
	loadAlgorithm: function () {
		var self=this;
		// 人脸
		let path = 'haarcascade_frontalface_default.xml'
		self.faceCascade = new cv.CascadeClassifier(path);
		if(self.faceCascade.empty()){

			wx.showLoading({
				title: '算法加载中...',
			})
			
			// 小程序云开发 获取算法
			wx.cloud.downloadFile({
				fileID: 'cloud://opencv-test-2gqmh03te94e8446.6f70-opencv-test-2gqmh03te94e8446-1312681439/ai/haarcascade_frontalface_default.xml',
				success: res => {
					const fs = wx.getFileSystemManager();
					fs.readFile({
						filePath: res.tempFilePath,
						success(res) {
							let data = new Uint8Array(res.data);
							try {
								cv.FS_createDataFile('/', path, data, true, false, false);
							} catch (error) {
								console.log(error)
							}
							self.faceCascade = new cv.CascadeClassifier(path);
							self.getcamera()
						},
						fail(res) {
							console.error(res)
							wx.showToast({
								title: '算法加载失败',
								icon: 'error',
								duration: 1500
							})
						}
					})
				},
				fail: err => {
				  wx.showToast({
					title: '算法获取失败',
					icon: 'error',
					duration: 1500
				  })
				},
				complete: wx.hideLoading
			})

			//  http 服务器下载 算法
			// wx.request({
			// 	url: ''http://xxxx,
			// 	data: {},
			// 	method:'GET',
			// 	header: {},
			// 	responseType: 'arraybuffer',
			// 	success: function(res) {
			// 		let data = new Uint8Array(res.data);
			// 		try {
			// 			cv.FS_createDataFile('/', path, data, true, false, false);
			// 		} catch (error) {
			// 			console.log(error)
			// 		}
			// 		self.faceCascade = new cv.CascadeClassifier(path);
			// 		self.getcamera()
			// 	},
			// 	fail: err => {
			// 		wx.showToast({
			// 			title: '算法下载失败',
			// 			icon: 'error',
			// 			duration: 1500
			// 		})
			// 	},
			// })

		} else{
			self.getcamera()
		} 		
	},
	// 获取摄像头帧
	getcamera:function(){
		var _that = this;
		var count = 0;
		const context = wx.createCameraContext();
		listener = context.onCameraFrame(async function (res) {
			
			// 每秒60帧，
			if (count < 10) {
				count++;
				return;
			}
			count = 0;
			_that.faceCheck(res)
		
		});
		listener.start();
	},
	// 人脸算法
	faceCheck(frame){
		var self=this;
		console.time("faceTime");
		var src = cv.matFromImageData({
			data:new Uint8ClampedArray(frame.data),
			width:frame.width,
			height:frame.height
		});
		
		var gray = new cv.Mat();
		cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

		//人脸
		var faces = new cv.RectVector();
		self.faceCascade.detectMultiScale(gray, faces, 3.0, 1, 0);
		for (let i = 0; i < faces.size(); ++i) {
			let face = faces.get(i);
			let point1 = new cv.Point(face.x, face.y);
			let point2 = new cv.Point(face.x + face.width, face.y + face.height);
			cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
		}
		
		// 识别眼睛
		let eyes = new cv.RectVector();
		// self.eyeCascade.detectMultiScale(gray, eyes, 2.0, 3, 0);
		// for (let i = 0; i < eyes.size(); ++i) {
		// 	let eye = eyes.get(i);
		// 	let eyepoint1 = new cv.Point(eye.x, eye.y);
		// 	let eyepoint2 = new cv.Point(eye.x + eye.width, eye.y + eye.height);
		// 	cv.rectangle(src, eyepoint1, eyepoint2, [255, 0, 0, 255]);
		// }

		cv.imshow(this.cameraCanvas, src);
		src.delete(); 
		gray.delete(); 
		faces.delete();
		eyes.delete();
		console.timeEnd("faceTime");
	
	},
	// 结束相机实时帧
	stopTacking() {
		if (listener) {
			listener.stop();
			console.log('stopTacking!!')
		}
	},
})
