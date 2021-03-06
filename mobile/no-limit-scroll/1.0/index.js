/**
 * @file index.js
 * @author zhenn, donghan@taobao.com
 * @version 1.0
 * @date 2013-05-11
 */

KISSY.add('mobile/no-limit-scroll/1.0/index' , function(S , iScroll) {

	'use strict';

	var Scroll = function(cfg) {
		Scroll.superclass.constructor.call(this , cfg);	
		this.init(cfg);
	};
	
	// 给Scroll类增加默认属性
	Scroll.ATTRS = {
		wrap: {
			value: S.one('#km-scroll')	
		},
		contentWrap: {
			value: S.one('#km-content')
		},
		trigMore: {
			value: S.one('#km-scroll-loading span')
		},
		loadStatus: {
			value: S.one('#km-scroll-status')			
		},
		initWrapHeight: {
			value: function () {
				throw new Error('iscroll包裹器还没有初始化高度,初始化时给值initWrapHeight');
			}				
		},
		getMoreInfo: {
			value: function(){
				throw new Error('初始化需要传入getMoreInfo句柄');
			}			 
		},
		// 当scroll内部视图（最小显示单元）超过threshold时，则会触发优化操作
		// 相反的，小于threshold时则不会做任何处理
		threshold: {
			value: 3		   
		},
		timer: {
			value: null	   
		},
		unitQueue: {
			value: [S.one('.km-scroll-unit').clone(true)]	
		},
		unitHeightQueue: {
			value: [S.one('.km-scroll-unit').height()]				  
		},
		y: {
			value: 0		
		},
		// 第几次请求数据
		index:{
			value: 0
		}
	};

	// 扩展Scroll的原型
	S.extend(Scroll , S.Base , {
		init: function() {
			var self = this , unit0 = S.one('.km-scroll-unit');
			unit0.css({
				height: unit0.height() + 'px'
			});

			var wrapH = self.get('initWrapHeight').call(self);
			self.get('wrap').height(wrapH);

			self.scrollObj = new iScroll('km-scroll' , {
				onScrollMove: function(a) {
					var that = this;
					self.moveCallback(that);	
				},
				onScrollEnd: function() {
					var that = this;
					self.endCallback(that);

				},
				onBeforeScrollEnd: function(e) {

				}
			});

			self.bindEvent();
		},
		/**
		 * scrollmove时的回调
		 * @param that {object} 当前iscroll实例对象
		 */
		moveCallback: function(that) {
			var self = this;
			self.get('timer') && clearTimeout(self.timer);
			self.set('timer' , setTimeout(function() {
				//
				// iscroll 滚动至最底部超过10px即触发回调
				if (that.y <= that.maxScrollY - 20) {
					self.get('trigMore').addClass('hidden');
					self.get('loadStatus').removeClass('hidden');
					return;
				}

				self.set('y' , that.y);

			} , 100));	 
		},

		/**
		 * 滚动结束后的回调
		 * @param void
		 */
		endCallback: function(that) {
			var self = this;
			// 是否在滚动至最底部以后才停止滚动的
			if (self.get('trigMore').hasClass('hidden')) {
				var index = self.get('index');
				index ++;
				self.set('index',index);
				self.get('getMoreInfo').call(self,index);	
				return;
			}			 

			self.set('y' , that.y);
		},

		// 绑定事件
		bindEvent: function() {
			var self = this;
			self.get('trigMore').on('click' , function() {
				S.one(this).addClass('hidden');
				self.get('loadStatus').removeClass('hidden');
				var index = self.get('index');
				index ++;
				self.set('index',index);
				self.get('getMoreInfo').call(self,index);
			});		

			self.on('afterYChange' , function(e) {
				self.YChangeHandler(e);
			});
		},
		
		/**
		 * 监听scroll对象在y方向发生偏移的回调
		 * @param e {object} S.Base提供的自定义对象
		 * @return void
		 */ 
		YChangeHandler: function (e) {
			if (this.get('unitHeightQueue').length <= this.get('threshold') ) {
				return
			}

			var prevVal = e.prevVal , newVal = e.newVal;
			// 向上滚动
			if (prevVal > newVal) {

				this.upScroll(newVal);
					
			} else {
				// 向下滚动	
				this.downScroll(newVal);
			}
		},
		
		/**
		 * 向上滚动的回调
		 * @param val {number} iscroll在y方向的偏移量
		 * @return void
		 */ 
		upScroll: function (val) {
			
			var unitHeightQueue = this.get('unitHeightQueue') , 
				unitQueue = this.get('unitQueue') , 
				y = Math.abs(val) , 
				curIndex = 0 ,
				units = S.all('.km-scroll-unit'),
				wrapperH = this.scrollObj.wrapperH ;

			for (var i = unitHeightQueue.length; i --; ) {
				if (y > unitHeightQueue[i] && y < unitHeightQueue[i + 1]) {
					// 当前视图所占全部视图的索引
					curIndex = i + 1;
					if (unitQueue[curIndex - 1]) {
						units.item(curIndex -1).empty();
					}

					// 对dom的innerHTML判断至关重要,若删除此判断，则严重影响滑动的流畅度	
					// !units.item(curIndex + 1).html()
					if (unitQueue[curIndex + 1] && !units.item(curIndex + 1).html() ) {
						units.item(curIndex + 1).html(unitQueue[curIndex + 1].html());	
					}
					break;
				}
			}		
		},

		/**
		 * 向下滚动的回调
		 * @param val {number} iscroll在y方向的偏移量
		 * @return void
		 */ 
		downScroll: function (val) {
			var unitHeightQueue = this.get('unitHeightQueue') , 
				unitQueue = this.get('unitQueue') , 
				y = Math.abs(val) , 
				curIndex = 0 ,
				units = S.all('.km-scroll-unit') ,
				wrapperH = this.scrollObj.wrapperH;

			for (var i = unitHeightQueue.length; i --; ) {
				if (y > unitHeightQueue[i] - wrapperH && y < unitHeightQueue[i + 1] - wrapperH) {
					// 当前视图所占全部视图的索引
					curIndex = i + 1;

					// 对dom的innerHTML判断至关重要,若删除此判断，则严重影响滑动的流畅度	
					// !units.item(curIndex + 1).html()
					//
					if (unitQueue[curIndex - 1] && !units.item(curIndex - 1).html() ) {
						units.item(curIndex - 1).html(unitQueue[curIndex - 1].html());
					}
					if (unitQueue[curIndex + 1]) {
						units.item(curIndex + 1).empty()
					}
					break;
				}
			}		
		},

		/**
		 * 向已有信息盒子增加内容 
		 * @param str {string} 获取的dom字符串
		 */
		addContent: function(str) {
			var self = this;
			var targetDom = S.one('<div class="km-scroll-unit">' + str + '</div>');
			this.get('contentWrap').append(targetDom);	

			S.later(function() {
				var targetHeight = targetDom.height();
				self.addUnitQueue(str);
				self.addUnitHeightQueue(targetHeight);
				self.scrollObj.refresh();
				targetDom.css('height' , targetHeight + 'px');
				
				//self.litePredom();
			} , 0);


		},

		/**
		 * 增加加载更多信息的队列，挂载到实例对象的unitQueue下面，保存每次加载的DOM
		 * @param str {string} 获取的dom字符串
		 */
		addUnitQueue: function (str) {
			var unitQueue = this.get('unitQueue');
			unitQueue.push(S.one('<div id="km-scroll-unit">' + str + '</div>'));
			this.set('unitQueue' , unitQueue);
		},
		
		/**
		 * 增加显示单元的高度队列 ， 用于计算视口当前区域所在的显示单元
		 * @param h {number} 最新加载的显示单元的高度
		 */ 
		addUnitHeightQueue: function (h) {
			var unitHeightQueue = this.get('unitHeightQueue');
			unitHeightQueue.push(unitHeightQueue[unitHeightQueue.length - 1] + h);
			this.set('unitHeightQueue' , unitHeightQueue);
		},
		
		/**
		 * 重置加载工具栏状态
		 * @param void
		 */ 
		resetLoad: function() {
			this.get('trigMore').removeClass('hidden');
			this.get('loadStatus').addClass('hidden');
		}

	});


	return Scroll;

} , {
	requires: [
		'mobile/iscroll-lite/',
		'base',
		'node',
		'ajax'
	]	
});
