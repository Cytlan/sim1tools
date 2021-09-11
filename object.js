//
//
//
//

/*

Direction flags:

      
0x01 ↗
0x04 ↘
0x10 ↙
0x40 ↖

*/

const fs = require('fs')
const pngjs = require('pngjs')

const SPRITE_WIDTH = 136
const SPRITE_HEIGHT = 384
const TILE_WIDTH = 128
const TILE_HEIGHT = 64

class GameObject
{
	constructor(objd, iff)
	{
		this.id = objd.masterId
		this.iff = iff
		this.definition = objd
		this.subObjects = []
		this.width = 0
		this.height = 0
		this.subObjectsCount = 0

		if(this.id == 0)
			this.addSubObject(objd)
	}

	addSubObject(objd)
	{
		if(objd.masterId != this.id || objd.slaveId == 65535)
			return
		let x = (objd.slaveId & 0xFF)
		let y = (objd.slaveId >> 8) & 0xFF
		if(!this.subObjects[x])
		{
			this.width++
			this.subObjects[x] = []
		}
		this.subObjects[x][y] = objd
		this.height++
		this.subObjectsCount++
	}

	getSubObject(dir, index)
	{
		let x = Math.floor(index / this.width)
		let y = index % this.width
		switch(dir)
		{
			case 0x01:
				return this.subObjects[x][y]
			case 0x04:

				break
			case 0x10:
				break
			case 0x40:
				break
		}
	}

	render(dir)
	{
		// This IFF contains no graphics - No reason to attempt to render this object
		if(!this.iff.chunks.DGRP || !this.iff.chunks.SPR2)
			return

		// RGBA bitmap
		let bitmapWidth = SPRITE_WIDTH + (this.width * (TILE_WIDTH / 2)) + (this.height * (TILE_WIDTH / 2))
		let bitmapHeight = SPRITE_HEIGHT + (this.width * (TILE_HEIGHT / 2)) + (this.height * (TILE_HEIGHT / 2))
		let bitmap = Buffer.alloc(bitmapWidth * bitmapHeight * 4)

		// Render all sub-objects
		for(let i = 0; i < this.subObjectsCount; i++)
		{
			// Get object
			let x = i % this.width
			let y = Math.floor(i / this.width)
			let tx = (dir == 0x10 || dir == 0x04 ? (this.width - 1) - x : x)
			let ty = (dir == 0x10 || dir == 0x40 ? (this.height) - y : y)

			if(!this.subObjects[tx])
				tx++
			let obj = this.subObjects[tx][ty]

			// Get sprite
			let dgrp = this.iff.chunks.DGRP[obj.baseGraphic]
			let sprInfo = dgrp.getSprite(dir, 3, 0)
			let spr = this.iff.chunks.SPR2[sprInfo.sprId]
			let pal = this.iff.chunks.PALT[spr.paletteId]
			let sprBitmap = spr.render(pal, sprInfo.frame)

			// Calculate sprite offset
			let offY = (x + y) * (TILE_HEIGHT / 2)
			let offX
			if(dir == 0x01 || dir == 0x10)
			{
				let spriteOffset = ((this.width - 1) * (TILE_WIDTH / 2))
				offX = spriteOffset + (y * (TILE_WIDTH / 2)) - (x * (TILE_WIDTH / 2))
			}
			else if(dir == 0x04 || dir == 0x40)
			{
				let spriteOffset = ((this.height) * (TILE_WIDTH / 2))
				offX = spriteOffset + (x * (TILE_WIDTH / 2)) - (y * (TILE_WIDTH / 2))
			}
			let byteOffset = (offX + (offY * bitmapWidth)) * 4

			// Compose image
			let srcRowStride = SPRITE_WIDTH * 4
			let dstRowStride = bitmapWidth * 4
			let pixelLen = Math.floor(sprBitmap.data.length)
			for(let j = 0; j < pixelLen; j += 4)
			{
				let dstOff = byteOffset + (Math.floor(j / srcRowStride ) * dstRowStride) + (j % srcRowStride)

				// Flip sprite?
				let srcOff
				if(sprInfo.flags & 1)
					srcOff = (Math.floor(j / srcRowStride ) * srcRowStride) + (srcRowStride - (j % srcRowStride))
				else
					srcOff = j

				if(bitmap[dstOff+3] == 0)
				{
					bitmap[dstOff]   = sprBitmap.data[srcOff]
					bitmap[dstOff+1] = sprBitmap.data[srcOff+1]
					bitmap[dstOff+2] = sprBitmap.data[srcOff+2]
					bitmap[dstOff+3] = sprBitmap.data[srcOff+3]
				}
			}
		}

		let png = new pngjs.PNG({width: bitmapWidth, height: bitmapHeight})
		png.data = bitmap
		let buf = pngjs.PNG.sync.write(png)
		let guid = Buffer.alloc(4)
		guid.writeUInt32BE(this.definition.guid)
		fs.writeFileSync('objs/'+guid.toString('hex')+'.png', buf)
	}
}

module.exports = GameObject
