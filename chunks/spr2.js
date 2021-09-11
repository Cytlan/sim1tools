//
//
//
//

const Chunk = require('./chunk.js')

class Sprite
{
	constructor(data)
	{
		this.width            = 0
		this.height           = 0
		this.flags            = 0
		this.paletteId        = 0
		this.transparentColor = 0
		this.yOffset          = 0
		this.xOffset          = 0
		this.rows             = []
		this.buf              = null
	}

	async parse(data)
	{
		this.width            = await data.read16()
		this.height           = await data.read16()
		this.flags            = await data.read32()
		this.paletteId        = await data.read16()
		this.transparentColor = await data.read16()
		this.yOffset          = await data.read16()
		this.xOffset          = await data.read16()

		this.buf = Buffer.alloc(this.width * this.height * 3)
		this.bufOffset = 0
		while(1)
		{
			let dataByte = await data.read16()
			if(!dataByte)
			{
				//console.log(data)
				this.error = new Error("No data")
				return
			}

			let cmd = dataByte >> 13
			let size = dataByte & 0x1FFF

			if(this.rows.length == this.height && cmd != 5)
				break

			// Pixel data
			if(cmd == 0)
			{
				//let row = await this.parsePixelData(data, size - 2)
				//if(this.error)
				//	return
				//this.rows.push(row)
				await this.parsePixelData(data, size - 2)
			}
			// Blank rows
			else if(cmd == 4)
			{
				this.bufOffset += size * this.width * 3
				//for(let i = 0; i < size; i++)
				//	this.rows.push([])
			}
			// End of sprite
			else if(cmd == 5)
				break
			// Error
			else
			{
				this.error = new Error("Unknown command: "+cmd)
				return
			}
		}
	}

	async parsePixelData(data, dataSize)
	{
		let end = data.tell() + dataSize
		let endOffset = this.bufOffset + (this.width * 3)
		let dataByte
		let cmd
		let size
		let tmp
		let i
		while(data.tell() < end)
		{
			dataByte = await data.read16()
			cmd = dataByte >> 13
			size = dataByte & 0x1FFF

			// 0x01 (color and z-buffer required) - Set the next pixel count pixels in the z-buffer and color 
			// channels to the values defined by the pixel data provided directly after this command. Every 
			// group of 2 bytes in the pixel data provides a luminosity (z-buffer) or color index (color) 
			// value to be copied to the row for the z-buffer channel and color channel, respectively, in 
			// that order, using the full opacity value of 255 for each pixel that is not the transparent color.
			switch(cmd)
			{
				case 1:
				{
					for(i = 0; i < size; i++)
					{
						this.buf[this.bufOffset++] = await data.read8()
						tmp = await data.read8()
						this.buf[this.bufOffset++] = tmp
						this.buf[this.bufOffset++] = tmp == this.transparentColor ? 0 : 31
					}
					break
				}

				// 0x02 (color, z-buffer, and alpha required)) - Set the next pixel count pixels in the z-buffer,
				// color, and alpha channels to the values defined by the pixel data provided directly after this
				// command. Every group of 3 bytes in the pixel data, minus the padding byte at the very end (if
				// it exists), provides a luminosity (z-buffer and alpha) or color index (color) value to be copied
				// to the row for the z-buffer, color, and alpha channels, respectively, in that order. The alpha
				// channel data is grayscale in the range 0-31, and the z buffer is in range 0-255.
				//else if(cmd == 2)
				case 2:
				{
					for(i = 0; i < size; i++)
					{
						this.buf[this.bufOffset++] = await data.read8()
						this.buf[this.bufOffset++] = await data.read8()
						this.buf[this.bufOffset++] = await data.read8()
					}
					// Padding
					if(size & 1)
						data.skip(1)
					break
				}

				// 0x03 - Leave the next pixel count pixels in the color channel filled with the transparent color,
				// in the z-buffer channel filled with 255, and in the alpha channel filled with 0. This pixel command
				// has no pixel data.
				//else if(cmd == 3)
				case 3:
				{
					for(i = 0; i < size; i++)
					{
						this.buf[this.bufOffset++] = 255
						this.buf[this.bufOffset++] = this.transparentColor
						this.buf[this.bufOffset++] = 0
					}
					break
				}

				// 0x06 - Set the next pixel count pixels in the color channel to the palette color indices
				// defined by the pixel data provided directly after this command. Every byte in the pixel data,
				// minus the padding byte at the very end (if it exists), provides a color index value to be copied
				// to the row for the color channel using the full opacity value of 255 and the closest z-buffer
				// value of 0 if the pixel is not the transparent color, or otherwise the no opacity value of 0 and
				// the farthest z-buffer value of 255.
				//else if(cmd == 6)
				case 6:
				{
					for(i = 0; i < size; i++)
					{
						tmp = await data.read8()
						this.buf[this.bufOffset++] = tmp == this.transparentColor ? 255 : 0
						this.buf[this.bufOffset++] = tmp
						this.buf[this.bufOffset++] = tmp == this.transparentColor ? 0 : 31
					}
					// Padding
					if(size & 1)
						data.skaip(1)
					break
				}
				
				default:
						this.error = new Error("Unknown command: " + cmd)
						return
			}
		}

		// Add padding
		while(this.bufOffset < endOffset)
		{
			this.buf[this.bufOffset++] = this.transparentColor
			this.buf[this.bufOffset++] = 255
			this.buf[this.bufOffset++] = 0
		}
	}
}

class SPR2 extends Chunk
{
	constructor()
	{
		super()
		this.version     = 0
		this.spriteCount = 0
		this.paletteId   = 0
		this.offsetTable = []
		this.sprites     = []
	}

	async readChunk(reader)
	{
		this.version = await reader.read32()

		if(this.version == 1000)
		{
			this.spriteCount = await reader.read32()
			this.paletteId = await reader.read32()
			for(let i = 0; i < this.spriteCount; i++)
				this.offsetTable.push(await reader.read32())
		}
		else if(this.version == 1001)
		{
			this.paletteId = await reader.read32()
			this.spriteCount = await reader.read32()
			throw new Error('Need to implement version 1001')
		}

		for(let i = 0; i < this.spriteCount; i++)
		{
			if(this.version == 1000)
				reader.seek(this.offsetTable[i])

			let sprite = new Sprite()
			await sprite.parse(reader)
			if(sprite.paletteId == 0xA3A3)
				sprite.paletteId = this.paletteId
			this.sprites.push(sprite)
		}
	}

	render(palette, spriteIndex)
	{
		// Make sure the sprite frame actually exists
		let spr = this.sprites[spriteIndex]
		if(!spr)
			throw new Error('Sprite '+spriteIndex+' doesn\'t exist in this SPR2')

		// Create the file buffer
		let dataSize = 136 * 384 * 4
		let fileSize = dataSize

		let out = Buffer.alloc(fileSize)
		for(let i = 0; i < fileSize; i++)
			out[i] = 0

		// Combine the channels and get the colours
		for(let i = 0; i < spr.height; i++)
		{
			let di = (spr.xOffset * 4) + (spr.yOffset * 136 * 4) + ((i) * 136 * 4)
			let o = i * spr.width * 3
			for(let j = 0; j < spr.width * 3; j += 3)
			{
				if(spr.buf[o+j+1] == spr.transparentColor)
				{
					out.writeUInt8(0, di++)
					out.writeUInt8(0, di++)
					out.writeUInt8(0, di++)
					out.writeUInt8(0, di++)
				}
				else
				{
					let c = palette.getColor(spr.buf[o+j+1])
					out.writeUInt8(c & 0xFF, di++)                      // R
					out.writeUInt8((c >> 8) & 0xFF, di++)               // G
					out.writeUInt8((c >> 16) & 0xFF, di++)              // B
					out.writeUInt8(((spr.buf[o+j+2] / 31) * 255) & 0xFF,  di++) // A
				}
			}
		}

		return {width: 136, height: 384, data: out}
	}
}

module.exports = SPR2
