//
//
//
//

class WAV
{
	constructor(options)
	{
		this.tag = options.tag || 0
		this.channels = options.channels || 0
		this.sampleRate = options.sampleRate || 0
		this.avgByteRate = options.avgByteRate || 0
		this.align = options.align || 0
		this.bits = options.bits || 0
		this.stream = options.stream || null
	}

	makeFile()
	{
		let len = this.stream.length
		let fileSize = 4+4+4+4+4+2+2+4+4+2+2+4+4+len
		let out = new Buffer(fileSize)

		let o = 0
		out.write('RIFF', o); o += 4;
		out.writeUInt32LE(fileSize - 8, o); o += 4;
		out.write('WAVE', o); o += 4;

		out.write('fmt ', o); o += 4;
		out.writeUInt32LE(16, o); o += 4;

		out.writeUInt16LE(this.tag, o); o += 2;
		out.writeUInt16LE(this.channels, o); o += 2;
		out.writeUInt32LE(this.sampleRate, o); o += 4;
		out.writeUInt32LE(this.avgByteRate, o); o += 4;
		out.writeUInt16LE(this.align, o); o += 2;
		out.writeUInt16LE(this.bits, o); o += 2;

		out.write('data', o); o += 4;
		out.writeUInt32LE(len, o); o += 4;

		for(let i = 0; i < len; i++)
			out.writeUInt8(this.stream[i], o++)

		return out
	}
}

const XATable =
[
	0, 240,  460,  392,
	0,   0, -208, -220,
	0,   1,    3,    4,
	7,   8,   10,   11,
	0,  -1,   -3,   -4
]

function clip16(sample)
{
	if(sample >= 32767) return 32767
	else if(sample <= -32768) return -32768
	else return sample
}

function Decode(input, blockCount, outSize, channelCount)
{
	let out = new Buffer(outSize)
	let outIndex = 0
	let channels = []
	for(let i = 0; i < channelCount; i++)
	{
		channels.push(
		{
			prevSample: 0,
			curSample: 0,
			divisor: 0,
			c1: 0,
			c2: 0
		})
	}
	while(blockCount--)
	{
		for(let i = 0; i < channelCount; i++)
		{
			let byte            = input.read8()
			channels[i].divisor = (byte & 0xF) + 8
			channels[i].c1      = XATable[((byte >> 4) & 0xF)]
			channels[i].c2      = XATable[((byte >> 4) & 0xF)+4]
		}
 
		for(let i = 0; i < 14; i++)
		{
			for(let j = 0; j < channelCount; j++)
			{
				let byte = input.read8()
				for(let n = 0; n < 2; n++)
				{
					let newVal = (n == 0) ? ((byte >> 4) & 0xF) : (byte & 0xF)
					newVal = (newVal << 28) >> channels[j].divisor
					newVal = (newVal + channels[j].curSample * channels[j].c1 + channels[j].prevSample * channels[j].c2 + 128) >> 8
					channels[j].prevSample = channels[j].curSample
					channels[j].curSample  = clip16(newVal)
				}
				out[outIndex++] = channels[j].prevSample & 0xFF
				out[outIndex++] = (channels[j].prevSample >> 8) & 0xFF
			}
			for(let j = 0; j < channelCount; j++)
			{
				out[outIndex++] = channels[j].curSample & 0xFF
				out[outIndex++] = (channels[j].curSample >> 8) & 0xFF
			}
		}
	}
 
	return out
}

function Parse(file, callback)
{
	if(!file.isLoaded)
	{
		file.load((err, res) =>
		{
			if(err) return callback(err, null)
			Parse(file, callback)
		})
		return
	}

	let id = file.readString(4) // string ID, which is equal to "XAI\0" (sound/speech) or "XAJ\0" (music)
	if(id != 'XAI' && id != 'XAJ')
		return callback(new Error("Invalid XA file"), null)
	let outSize     = file.read32() // the output size of the audio stream stored in the file (in bytes).
	let tag         = file.read16() // seems to be PCM waveformat tag (0x0001). This corresponds to the (decompressed) output audio stream, of course.
	let channels    = file.read16() // number of channels for the file. 
	let sampleRate  = file.read32() // sample rate for the file. 
	let avgByteRate = file.read32() // average byte rate for the file (equal to (sampleRate)*(align)). Note that this also corresponds to the decompressed output audio stream.
	let align       = file.read16() // the sample align value for the file (equal to (bits/8)*(channels)). Again, this corresponds to the decompressed output audio stream.
	let bits        = file.read16() // resolution of the file (8 (8-bit), 16 (16-bit), etc.).

	let blockCount = (file.size - 24) / 15

	let pcm = Decode(file, blockCount, outSize, channels)

	let wav = new WAV({
		tag: tag,
		channels: channels,
		sampleRate: sampleRate,
		avgByteRate: avgByteRate,
		align: align,
		bits: bits,
		stream: pcm
	})

	callback(null, wav)
}

module.exports.parse = Parse
