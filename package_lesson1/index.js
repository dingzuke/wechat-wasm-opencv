
// wasm路径
global.wasm_url = '/assets/opencv3.4.16.wasm.br'
// opencv_exec.js会从global.wasm_url获取wasm路径
let cv = require('../assets/opencv_exec.js');

let listener;

Page({
	// 视频
	cameraCanvas: null,

	data: {
	},
	onReady() {
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

	cameraData:undefined,
	getcamera:function(){
		var _that = this;
		var count = 0;
		const context = wx.createCameraContext();
		listener = context.onCameraFrame(async function (res) {
			// 每秒60帧，这里控制每0.5获取一次图片
			if (count < 10) {
				count++;
				return;
			}
			count = 0;
			// _that.stopTacking()
			// onCameraFrame 获取的是未经过编码的原始 RGBA 格式的图像数据，接下来转为图片
			_that.changeDataToBase64(res)
		
		});
		listener.start();

		// const context = wx.createCameraContext()
		// listener = context.onCameraFrame((frame) => {
			
		// 	if(!_that.cameraData){
		// 		// console.log('frame===>',frame)
		// 		_that.cameraData=frame;
		// 		_that.changeDataToBase64(frame)
		// 	}
		// })
		// listener.start();
	},

	changeDataToBase64(frame) {
		// 图像处理
		var src = cv.matFromImageData({
			data:new Uint8ClampedArray(frame.data),
			width:frame.width,
			height:frame.height
		});
		var dst = new cv.Mat();
		
		// 灰度化
		cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
		var orb = new cv.ORB();
		var keypoints = new cv.KeyPointVector();
		var descriptors = new cv.Mat();
		// 特征点
		orb.detect(src, keypoints)
		// 特征点的描述因子
		orb.compute(src, keypoints, descriptors)
		// 绘制特征点
		cv.drawKeypoints(src, keypoints, dst)
		cv.imshow(this.cameraCanvas, dst);

		src.delete();
		dst.delete()

		return
		
		// let that = this
		// var data = new Uint8Array(frame.data);
		// var clamped = new Uint8ClampedArray(data);
		wx.canvasPutImageData({
			canvasId: 'mycanvas',
			x: 0,
			y: 0,
			width: frame.width,
			height: frame.height,
			data: new Uint8ClampedArray(dst.data),
			fail(res) {
				console.log('fail---',res)
				// 回收对象
				// src.delete();
				// gray.delete()
			},
			success(res) {
				// 回收对象
				// src.delete();
				// gray.delete()
				// 转换临时文件
				console.log('success---',res)
				// wx.canvasToTempFilePath({
				// 	x: 0,
				// 	y: 0,
				// 	width: frame.width,
				// 	height: frame.height,
				// 	canvasId: 'mycanvas',
				// 	fileType: 'jpg',
				// 	destWidth: frame.width,
				// 	destHeight: frame.height,
				// 	// 精度修改
				// 	quality: 0.8,
				// 	success(res) {
				// 		console.log('success2---',res)
				// 		// 临时文件转base64
				// 		wx.getFileSystemManager().readFile({
				// 			filePath: res.tempFilePath, //选择图片返回的相对路径
				// 			encoding: 'base64', //编码格式
				// 			success: res => {
				// 				// 保存base64
				// 				let base64 = res.data;    
				// 				// 拿到数据后的其他操作   
				// 			}
				// 		})
				// 	},
				// 	fail(res) {
				// 		console.log('fail2---',res)
				// 		wx.showToast({
				// 			title: '图片生成失败，重新检测',
				// 			icon: 'none',
				// 			duration: 1000
				// 		})
				// 		// 测试的时候发现安卓机型，转为临时文件失败，这里从新获取帧数据，再转码就能成功，不知道为什么
				// 		that.startTacking()
				// 	}
				// }, that)
			}
		})
	},
	// 结束相机实时帧
	stopTacking() {
		if (listener) {
			listener.stop();
			console.log('stopTacking!!')
		}
	},
})
