/*
 * Audiovisualization using the html canvas element.
 * ©2017, Dominik Hofacker
 * https://www.behance.net/dominikhofacker
 * Please consider supporting this project on behance:
 * https://www.behance.net/gallery/49260123/Web-Audio-Visualization
 */

var rafID = null;
var analyser = null;
var c = null;
var cDraw = null;
var ctx = null;
var microphone = null;
var ctxDraw = null;

var loader;
var filename;
var fileChosen = false;
var hasSetupUserMedia = false;

//handle different prefix of the audio context
var AudioContext = AudioContext || webkitAudioContext;
//create the context.
var context = new AudioContext();

//using requestAnimationFrame instead of timeout...
if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;

$(function () {
    "use strict";
    loader = new BufferLoader();
    initBinCanvas();
});

function handleFiles(files) {
    if (files.length === 0) {
        return;
    }
    fileChosen = true;
    setupAudioNodes();
    var fileReader = new FileReader();
    fileReader.onload = function () {
        var arrayBuffer = this.result;

        filename = files[0].name.toString();
        filename = filename.slice(0, -4);
        console.log(filename);

        var url = files[0].urn || files[0].name;
        ID3.loadTags(url, function () {
            var tags = ID3.getAllTags(url);

//                    console.log(tags.title.toString().length);
//                    if (tags.title.length > 14) {
//                        var newTitle = tags.title.substring(0,14);
//                        newTitle += "...";
//                        $("#title").html(newTitle);
//                    }
//                    else {
//                        $("#title").html(tags.title);
//                    }
            if (tags.title.length > 14 && tags.title.length <= 17) {

                $("#title").css("font-size", "7.5vh");

            }
            if (tags.title.length > 17 && tags.title.length <= 20) {

                $("#title").css("font-size", "6.5vh");
            }

            if (tags.title.length > 20) {

                $("#title").css("font-size", "5vh");

            }

            $("#title").html(tags.title);

            onWindowResize();

            $("#title").css("visibility", "visible");

            $("#artist").html(tags.artist);
            $("#artist").css("visibility", "visible");
            $("#album").html(tags.album);
            $("#album").css("visibility", "visible");
        }, {
            tags: ["title", "artist", "album", "picture"],
            dataReader: ID3.FileAPIReader(files[0])
        });

    };
    fileReader.readAsArrayBuffer(files[0]);
    var url = URL.createObjectURL(files[0]);

    var request = new XMLHttpRequest();

    request.addEventListener("progress", updateProgress);
    request.addEventListener("load", transferComplete);
    request.addEventListener("error", transferFailed);
    request.addEventListener("abort", transferCanceled);

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // When loaded decode the data
    request.onload = function () {
        // decode the data
        context.decodeAudioData(request.response, function (buffer) {
            // when the audio is decoded play the sound
            sourceNode.buffer = buffer;
            sourceNode.start(0);
            $("#freq, body").addClass("animateHue");
            //on error
        }, function (e) {
            // console.log(e);
        });
    };
    request.send();

    $("button, input").prop("disabled", true);
}

function resetDisplay() {
    // $("#title").html("丶🐔露Y");
    $("#title").html("点我<img height=\"100px\" width=\"100px\" src=\"/static/img/cjk.jpg\">点我");
    $("#album").html("やめて");
    $("#artist").html("性感荷官在线语Y");
    $('#title').off('click');
    $("#title").click(function () {
        startRecording();
        $("#title").html("露Ying");
        $("#album").html("再次丶🐔露Y完成");
        $("#title").click(function () {
            $("#title").html("正在上传");
            $("#album").html("嘻嘻嘻");
            stopRecording();
            uploadAudio();
        })
    });
}

function useMic() {
    "use strict";
    if (!navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support microphone input!");
        console.log('Your browser does not support microphone input!');
        return;
    }

    navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(function (stream) {
            hasSetupUserMedia = true;
            //convert audio stream to mediaStreamSource (node)
            microphone = context.createMediaStreamSource(stream);
            //create analyser
            if (analyser === null) analyser = context.createAnalyser();
            //connect microphone to analyser
            microphone.connect(analyser);
            //start updating
            rafID = window.requestAnimationFrame(updateVisualization);

            onWindowResize();
            $("#title, #artist, #album").css("visibility", "visible");
            $("#freq, body").addClass("animateHue");

            resetDisplay();
        })
        .catch(function (err) {
            /* handle the error */
            alert("Capturing microphone data failed! (currently only supported in Chrome & Firefox)");
            console.log('capturing microphone data failed!');
            console.log(err);
        });
}

// progress on transfers from the server to the client (downloads)
function updateProgress(oEvent) {
    if (oEvent.lengthComputable) {
        $("button, input").prop("disabled", true);
        var percentComplete = oEvent.loaded / oEvent.total;
        console.log("Loading music file... " + Math.floor(percentComplete * 100) + "%");
        $("#loading").html("Loading... " + Math.floor(percentComplete * 100) + "%");
    } else {
        // Unable to compute progress information since the total size is unknown
        console.log("Unable to compute progress info.");
    }
}

function transferComplete(evt) {
    console.log("The transfer is complete.");
    $("#loading").html("");
    //$("button, input").prop("disabled",false);
}

function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
    $("#loading").html("Loading failed.");
    $("button, input").prop("disabled", false);
}

function transferCanceled(evt) {
    console.log("The transfer has been canceled by the user.");
    $("#loading").html("Loading canceled.");
}

function initBinCanvas() {

    //add new canvas
    "use strict";
    c = document.getElementById("freq");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    //get context from canvas for drawing
    ctx = c.getContext("2d");

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    window.addEventListener('resize', onWindowResize, false);

    //create gradient for the bins
    var gradient = ctx.createLinearGradient(0, c.height - 300, 0, window.innerHeight - 25);
    gradient.addColorStop(1, '#00f'); //black
    gradient.addColorStop(0.75, '#f00'); //red
    gradient.addColorStop(0.25, '#f00'); //yellow
    gradient.addColorStop(0, '#ffff00'); //white


    ctx.fillStyle = "#9c0001";
}

function onWindowResize() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    var containerHeight = $("#song_info_wrapper").height();
    var topVal = $(window).height() / 2 - containerHeight / 2;
    $("#song_info_wrapper").css("top", topVal);
    // console.log(topVal);

    if ($(window).width() <= 500) {
        //TODO: not yet working
        $("#title").css("font-size", "40px");
    }
}

var audioBuffer;
var sourceNode;

function setupAudioNodes() {
    // setup a analyser
    analyser = context.createAnalyser();
    // create a buffer source node
    sourceNode = context.createBufferSource();
    //connect source to analyser as link
    sourceNode.connect(analyser);
    // and connect source to destination
    sourceNode.connect(context.destination);
    //start updating
    rafID = window.requestAnimationFrame(updateVisualization);
}


function reset() {
    if (typeof sourceNode !== "undefined") {
        sourceNode.stop(0);
    }
    if (typeof microphone !== "undefined") {
        microphone = null;
    }
}


function updateVisualization() {

    // get the average, bincount is fftsize / 2
    if (fileChosen || hasSetupUserMedia) {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        drawBars(array);
    }
    // setTextAnimation(array);


    rafID = window.requestAnimationFrame(updateVisualization);
}

function drawBars(array) {

    //just show bins with a value over the treshold
    var threshold = 0;
    // clear the current state
    ctx.clearRect(0, 0, c.width, c.height);
    //the max count of bins for the visualization
    var maxBinCount = array.length;
    //space between bins
    var space = 3;

    ctx.save();


    ctx.globalCompositeOperation = 'source-over';

    //console.log(maxBinCount); //--> 1024
    ctx.scale(0.5, 0.5);
    ctx.translate(window.innerWidth, window.innerHeight);
    ctx.fillStyle = "#fff";

    var bass = Math.floor(array[1]); //1Hz Frequenz
    var radius = 0.45 * $(window).width() <= 450 ? -(bass * 0.25 + 0.45 * $(window).width()) : -(bass * 0.25 + 450);

    var bar_length_factor = 1;
    if ($(window).width() >= 785) {
        bar_length_factor = 1.0;
    }
    else if ($(window).width() < 785) {
        bar_length_factor = 1.5;
    }
    else if ($(window).width() < 500) {
        bar_length_factor = 20.0;
    }
    // console.log($(window).width());
    //go over each bin
    for (var i = 0; i < maxBinCount; i++) {

        var value = array[i];
        if (value >= threshold) {
            //draw bin
            //ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
            //ctx.fillRect(i * space, c.height, 2, -value);
            ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
            ctx.rotate((180 / 128) * Math.PI / 180);
        }
    }

    for (var i = 0; i < maxBinCount; i++) {

        var value = array[i];
        if (value >= threshold) {

            //draw bin
            //ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
            //ctx.fillRect(i * space, c.height, 2, -value);
            ctx.rotate(-(180 / 128) * Math.PI / 180);
            ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
        }
    }

    for (var i = 0; i < maxBinCount; i++) {

        var value = array[i];
        if (value >= threshold) {

            //draw bin
            //ctx.fillRect(0 + i * space, c.height - value, 2 , c.height);
            //ctx.fillRect(i * space, c.height, 2, -value);
            ctx.rotate((180 / 128) * Math.PI / 180);
            ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);
        }
    }

    ctx.restore();
}

//function setTextAnimation(array)
//{
//    var bass = Math.floor(array[1]); //4Hz Frequenz 
//    
//    
//    var fontSize = bass * 0.25 + 50;
//    
//    ctx.save();
//    ctx.globalCompositeOperation='destination-over';
//    ctx.fillStyle = "#fff";
//    ctx.filter = "blur(16px)";
//    
//    var neueFontsize = 70;
//    if (fontSize > neueFontsize) {
//        neueFontsize = fontSize;
//    }
//    
//    //ctx.font = neueFontsize.toString() + "px Arial";
//    if (navigator.userAgent.indexOf("Chrome/53.0.2764.0") > -1) { //besserer Look in Chrome Canary
//        console.log("Chrome Canary User Agent detected");
//        ctx.font="normal normal 300 350px Roboto";
//        if (filename !== undefined) {
//            ctx.fillText(filename, 0, c.height - 200);
//        }
//    }
//    ctx.filter = "blur(0px)";
//    //ctx.font="normal normal 100 " + neueFontsize.toString() + "px Roboto";
//    ctx.font="normal normal 100 70px Roboto";
//    if (filename !== undefined) {
//        ctx.fillText(filename, window.innerWidth / 2 - 125, c.height / 2);
//    }
//    ctx.restore();
//}

///////////////
(function (window) {
    //兼容
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    var HZRecorder = function (stream, config) {
        config = config || {};
        config.sampleBits = config.sampleBits || 16;      //采样数位 8, 16
        config.sampleRate = config.sampleRate || (44100 / 4);   //采样率(1/6 44100)

        var context = new (window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 1, 1]);

        var audioData = {
            size: 0          //录音文件长度
            , buffer: []     //录音缓存
            , inputSampleRate: context.sampleRate    //输入采样率
            , inputSampleBits: 16       //输入采样数位 8, 16
            , outputSampleRate: config.sampleRate    //输出采样率
            , oututSampleBits: config.sampleBits       //输出采样数位 8, 16
            , input: function (data) {
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            }
            , compress: function () { //合并压缩
                //合并
                var data = new Float32Array(this.size);
                var offset = 0;
                for (var i = 0; i < this.buffer.length; i++) {
                    data.set(this.buffer[i], offset);
                    offset += this.buffer[i].length;
                }
                //压缩
                var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
                var length = data.length / compression;
                var result = new Float32Array(length);
                var index = 0, j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index++;
                }
                return result;
            }
            , encodeWAV: function () {
                var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                var bytes = this.compress();
                var dataLength = bytes.length * (sampleBits / 8);
                var buffer = new ArrayBuffer(44 + dataLength);
                var data = new DataView(buffer);

                var channelCount = 1;//单声道
                var offset = 0;

                var writeString = function (str) {
                    for (var i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                }

                // 资源交换文件标识符
                writeString('RIFF');
                offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8
                data.setUint32(offset, 36 + dataLength, true);
                offset += 4;
                // WAV文件标志
                writeString('WAVE');
                offset += 4;
                // 波形格式标志
                writeString('fmt ');
                offset += 4;
                // 过滤字节,一般为 0x10 = 16
                data.setUint32(offset, 16, true);
                offset += 4;
                // 格式类别 (PCM形式采样数据)
                data.setUint16(offset, 1, true);
                offset += 2;
                // 通道数
                data.setUint16(offset, channelCount, true);
                offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度
                data.setUint32(offset, sampleRate, true);
                offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
                offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
                data.setUint16(offset, channelCount * (sampleBits / 8), true);
                offset += 2;
                // 每样本数据位数
                data.setUint16(offset, sampleBits, true);
                offset += 2;
                // 数据标识符
                writeString('data');
                offset += 4;
                // 采样数据总数,即数据总大小-44
                data.setUint32(offset, dataLength, true);
                offset += 4;
                // 写入采样数据
                if (sampleBits === 8) {
                    for (var i = 0; i < bytes.length; i++, offset++) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (var i = 0; i < bytes.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }

                return new Blob([data], {type: 'audio/wav'});
            }
        };

        //开始录音
        this.start = function () {
            audioInput.connect(recorder);
            recorder.connect(context.destination);
        }

        //停止
        this.stop = function () {
            recorder.disconnect();
        }

        //获取音频文件
        this.getBlob = function () {
            this.stop();
            return audioData.encodeWAV();
        }

        //回放
        this.play = function (audio) {
            audio.src = window.URL.createObjectURL(this.getBlob());
        }

        //上传
        this.upload = function (url, callback) {
            var fd = new FormData();
            fd.append("audioData", this.getBlob());
            var xhr = new XMLHttpRequest();
            if (callback) {
                xhr.upload.addEventListener("progress", function (e) {
                    callback('uploading', e, xhr.response);
                }, false);
                xhr.addEventListener("load", function (e) {
                    callback('ok', e, xhr.response);
                }, false);
                xhr.addEventListener("error", function (e) {
                    callback('error', e, xhr.response);
                }, false);
                xhr.addEventListener("abort", function (e) {
                    callback('cancel', e, xhr.response);
                }, false);
            }
            xhr.open("POST", url);
            xhr.send(fd);
        }

        //音频采集
        recorder.onaudioprocess = function (e) {
            audioData.input(e.inputBuffer.getChannelData(0));
            //record(e.inputBuffer.getChannelData(0));
        }

    };
    //抛出异常
    HZRecorder.throwError = function (message) {
        alert(message);
        throw new function () {
            this.toString = function () {
                return message;
            }
        }
    }
    //是否支持录音
    HZRecorder.canRecording = (navigator.getUserMedia != null);
    //获取录音机
    HZRecorder.get = function (callback, config) {
        if (callback) {
            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    {audio: true} //只启用音频
                    , function (stream) {
                        var rec = new HZRecorder(stream, config);
                        callback(rec);
                    }
                    , function (error) {
                        switch (error.code || error.name) {
                            case 'PERMISSION_DENIED':
                            case 'PermissionDeniedError':
                                HZRecorder.throwError('用户拒绝提供信息。');
                                break;
                            case 'NOT_SUPPORTED_ERROR':
                            case 'NotSupportedError':
                                HZRecorder.throwError('浏览器不支持硬件设备。');
                                break;
                            case 'MANDATORY_UNSATISFIED_ERROR':
                            case 'MandatoryUnsatisfiedError':
                                HZRecorder.throwError('无法发现指定的硬件设备。');
                                break;
                            default:
                                HZRecorder.throwError('无法打开麦克风。异常信息:' + (error.code || error.name));
                                break;
                        }
                    });
            } else {
                HZRecorder.throwErr('当前浏览器不支持录音功能。');
                return;
            }
        }
    }

    window.HZRecorder = HZRecorder;

})(window);

var recorder;

function startRecording() {
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
    });
}

function stopRecording() {
    recorder.stop();
}

function playRecording() {
    recorder.play(audio);
}

function uploadAudio() {
    recorder.upload("chat", function (state, e, data) {
        switch (state) {
            case 'uploading':
                //var percentComplete = Math.round(e.loaded * 100 / e.total) + '%';
                break;
            case 'ok':
                resetDisplay();
                var audio = document.querySelector('audio');
                var blob = new Blob([data], {type: 'audio/wav'});
                var objectUrl = URL.createObjectURL(blob);
                console.log(objectUrl);
                console.log(audio);
                audio.setAttribute('src', "/static/output.wav");
                audio.play();
                break;
            case 'error':
                resetDisplay();
                $("#title").html("上传失败");
                $("#album").html("再次点击重试");
                break;
            case 'cancel':
                alert("上传被取消");
                break;
        }
    });
}

useMic();