//
// DGRP chunk parser
//
// This chunk contains information on how to draw sprites
//

const Chunk = require('./chunk.js')

class SpriteInfo
{
	constructor(version)
	{
		this.version    = version
		this.type       = 0
		this.sprId      = 0
		this.frame      = 0
		this.sprOffsetX = 0
		this.sprOffsetY = 0
		this.objOffsetZ = 0
		this.flags      = 0
		this.objOffsetX = 0
		this.objOffsetY = 0
	}

	async read2or4(reader)
	{
		if(this.version == 20000 || this.version == 20001)
			return await reader.read16signed()
		if(this.version == 20003 || this.version == 20004)
			return await reader.read32signed()
	}

	async readBinary(reader)
	{
		if(this.version == 20000 || this.version == 20001)
			this.type = await reader.read16()

		this.sprId = await this.read2or4(reader)
		this.frame = await this.read2or4(reader)

		if(this.version == 20000 || this.version == 20001)
			this.flags = await reader.read16()

		this.sprOffsetX = await this.read2or4(reader)
		this.sprOffsetY = await this.read2or4(reader)

		if(this.version == 20001 || this.version == 20003 || this.version == 20004)
			this.objOffsetZ = await reader.readFloat()
		if(this.version == 20003 || this.version == 20004)
			this.flags = await reader.read32()
		if(this.version == 20004)
			this.objOffsetX = await reader.readFloat()
		if(this.version == 20004)
			this.objOffsetY = await reader.readFloat()
	}
}

class Image
{
	constructor(version)
	{
		this.version = version
		this.dirFlags   = 0
		this.zoomFactor = 0
		this.sprites    = []
	}

	async read1or4(reader)
	{
		if(this.version == 20000 || this.version == 20001)
			return await reader.read8()
		if(this.version == 20003 || this.version == 20004)
			return await reader.read32()
	}

	async readBinary(reader)
	{
		let count = 0

		// v20000 and v20001 has the count field first
		if(this.version == 20000 || this.version == 20001)
			count = await reader.read16()

		this.dirFlags = await this.read1or4(reader)
		this.zoomFactor = await this.read1or4(reader)

		// v20003 and v20004 has the count field last
		if(this.version == 20003 || this.version == 20004)
			count = await reader.read32()

		if(count == 0xFFFE)
		{
			throw new Error('Error')
		}

		for(let i = 0; i < count; i++)
		{
			let spr = new SpriteInfo(this.version)
			await spr.readBinary(reader)
			this.sprites.push(spr)
		}
	}
}

class DGRP extends Chunk
{
	constructor()
	{
		super()
		this.version = 0
		this.images = []
	}

	async readChunk(reader)
	{
		this.version = await reader.read16()
		if(this.version > 20004 || this.version < 20000)
			throw new Error("Unknown version " + this.version)
		let count = 0
		if(this.version == 20000 || this.version == 20001)
			count = await reader.read16()
		if(this.version == 20003 || this.version == 20004)
			count = await reader.read32()

		for(let i = 0; i < count; i++)
		{
			let img = new Image(this.version)
			await img.readBinary(reader)
			this.images.push(img)
		}
	}

	getSprite(dir, zoom, frame)
	{
		for(let i = 0; i < this.images.length; i++)
		{
			let img = this.images[i]
			if(img.zoomFactor == zoom && (img.dirFlags & dir))
			{
				return img.sprites[frame]
			}
		}
	}

	export()
	{
		return ''
	}
}

module.exports = DGRP
