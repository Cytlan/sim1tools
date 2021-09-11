//
// Convert mp3, wav and xa to opus
//

const fs   = require('fs')
const opus = require('node-opus')
const ogg  = require('ogg')
const XA   = require('./xa.js')
const File = require('./file.js')
const stream = require('stream')
const WAE = require("web-audio-engine")
const OfflineAudioContext = WAE.OfflineAudioContext
const AudioContext = WAE.RenderingAudioContext
const WavDecoder = require("wav-decoder")
const lame = require("lame")

function resample(inputChannels, inputRate, outputRate, callback)
{
	let channels = inputChannels.length
	let inputSamples = inputChannels[0].length
	let inputTime = inputSamples / inputRate
	let outputSamples = Math.ceil(inputTime * outputRate)

	let context = new OfflineAudioContext(channels, outputSamples, outputRate);
	let buffer = context.createBuffer(channels, inputSamples, inputRate);

	// Convert input stream to AudioBuffer floats
	//console.log("resample - copy data")
	let index = 0
	for(let channel = 0; channel < channels; channel++)
	{
		let buf = buffer.getChannelData(channel);
		for(let i = 0; i < inputSamples; i++)
			buf[i] = inputChannels[channel][i]
	}

	// Play it
	let source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start(0);
	//console.log("resample - render")
	context.startRendering().then((audioBuffer) =>
	{
		// Convert from AudioBuffer floats to signed 16-bit
		let data = []
		for(let i = 0; i < channels; i++)
		{
			let channelData = audioBuffer.getChannelData(i)
			data.push(channelData)
		}
		let interleaved = interleaveChannels(data)
		let ints = floatToInt(interleaved)
		callback(ints)
	})
}

function intToFloat(data)
{
	//console.log("convert ints to floats")
	let len = data.length / 2
	let out = new Float32Array(len)
	for(let i = 0; i < len; i++)
	{
		out[i] = data.readInt16LE(i * 2) / 32768
	}
	return out
}

function floatToInt(data)
{
	//console.log("convert floats to ints")
	let len = data.length
	let out = new Buffer(len * 2)
	for(let i = 0; i < len; i++)
		out.writeInt16LE(data[i] * 32768, i * 2)
	return out
}

function interleaveChannels(channels)
{
	//console.log("interleave channels")
	let numberOfChannels = channels.length
	let samples = channels[0].length
	let size = samples * numberOfChannels
	let out = new Float32Array(size)
	let outIndex = 0
	for(let i = 0; i < samples; i++)
	{
		for(let j = 0; j < numberOfChannels; j++)
			out[outIndex++] = channels[j][i]
	}
	return out
}

function splitChannels(data, channelCount)
{
	//console.log("split channels")
	let inputSize = data.length
	let channelSize = inputSize / channelCount
	let channels = []
	for(let i = 0; i < channelCount; i++)
		channels[i] = new Float32Array(channelSize)
	let channelIndex = 0
	for(let i = 0; i < inputSize;)
	{
		for(let j = 0; j < channelCount; j++)
			channels[j][channelIndex] = data[i++]
		channelIndex++
	}
	return channels
}

function getRate(inputRate)
{
	let rates = [48000, 24000, 16000, 8000]
	let rate = 0
	for(let i in rates)
	{
		if(rates[i] > inputRate)
			rate = rates[i]
	}
	return rate
}

function AudioEncode(inputFile, callback)
{
	if(!inputFile.isLoaded)
	{
		inputFile.load((err, res) =>
		{
			if(err) return callback(err, null)
			AudioEncode(inputFile, callback)
		})
		return
	}

	//console.log("start")
	let filename = inputFile.basename+'.ogg'
	switch(inputFile.extension)
	{
		case 'xa':
			XA.parse(inputFile, (err, xa) =>
			{
				let wav = WavDecoder.decode.sync(xa.makeFile())
				encode(wav.channelData, wav.sampleRate, filename, callback)
			})
			break
		case 'wav':
			{
				let wav = WavDecoder.decode.sync(inputFile.data)
				encode(wav.channelData, wav.sampleRate, filename, callback)
			}
			break
		case 'mp3':
			{
				var decoder = new lame.Decoder()
				decoder.on('format', (format) =>
				{
					unstream(decoder, (err, buffer) =>
					{
						let floats = intToFloat(buffer)
						let channels = splitChannels(floats, format.channels)
						encode(channels, format.sampleRate, filename, callback)
					})
				})
				let bufferStream = new stream.PassThrough()
				bufferStream.end(inputFile.data)
				bufferStream.pipe(decoder)
			}
			break
		default:
			callback(new Error("Cannot convert file: Unknown type"), null)
			break
	}
}

function unstream(inputStream, callback)
{
	let _unstream = new stream.Writable();
	_unstream.data = [];
	_unstream._write = function(chunk, encoding, callback)
	{
		this.data.push(chunk);
		callback()
	};
	_unstream.on('finish', function()
	{
		let buffer = Buffer.concat(this.data)
		callback(null, buffer)
	});
	inputStream.pipe(_unstream)
}

function encode(channels, sampleRate, filename, callback)
{
	let channelCount = channels.length
	let resampleRate = getRate(sampleRate)
	resample(channels, sampleRate, resampleRate, (resampled) =>
	{
		console.log("encode")
		oggEncode(resampled, resampleRate, channelCount, (err, encoded) =>
		{
			let oggFile = new File(filename)
			oggFile.setData(encoded)
			callback(null, oggFile)
		})
	})
}

function oggEncode(pcm, rate, channels, callback)
{
	let opusEncoder = new opus.Encoder(rate, channels);
	let oggEncoder = new ogg.Encoder();

	let bufferStream = new stream.PassThrough()
	bufferStream.end(pcm)


	bufferStream.pipe(opusEncoder).pipe(oggEncoder.stream())
	unstream(oggEncoder, callback)
}

//let filePath = './Latin7.mp3'
//let filePath = './sting_danger1.wav'
//let filePath = './VOX_CONVERSE_HIGH_LEADM1.XA'
/*
AudioEncode(new File(filePath), (err, oggFile) =>
{
	if(err) throw err
	oggFile.write('./', (err, res) =>
	{
		if(err) throw err
	})
})
*/

module.exports = AudioEncode
