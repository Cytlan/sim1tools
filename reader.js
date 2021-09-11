//
//
//
//

class Reader
{
	constructor(data)
	{
		this.data = data
		this.size = data.length
		this.offset = 0
		this.littleEndian()
	}

	//
	// Parse helper functions
	//

	bigEndian()
	{
		this.endian = 1
	}

	littleEndian()
	{
		this.endian = 0
	}

	tell()
	{
		return this.offset
	}

	seek(offset)
	{
		this.offset = offset
	}

	skip(offset)
	{
		this.offset += offset
	}

	rewind(offset)
	{
		this.offset -= offset
	}

	async read32signed(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 4 >= this.size)
			return this.read16signed()
		if(!this.endian)
			out = this.data.readInt32LE(this.offset)
		else
			out = this.data.readInt32BE(this.offset)
		this.offset += 4
		return out
	}

	async read32(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 4 >= this.size)
			return this.read24()
		if(!this.endian)
			out = this.data.readUInt32LE(this.offset)
		else
			out = this.data.readUInt32BE(this.offset)
		this.offset += 4
		return out
	}

	async read24(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 3 >= this.size)
			return this.read16()
		if(!this.endian)
			out = this.data.readUInt16LE(this.offset) | (this.data.readUInt8(this.offset + 2) << 16)
		else
			out = (this.data.readUInt16BE(this.offset) << 8) | this.data.readUInt8(this.offset + 2)
		this.offset += 3
		return out
	}

	async read16signed(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 2 >= this.size)
			return this.read8signed()
		if(!this.endian)
			out = this.data.readInt16LE(this.offset)
		else
			out = this.data.readInt16BE(this.offset)
		this.offset += 2
		return out
	}

	async read16(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 2 >= this.size)
			return this.read8()
		if(!this.endian)
			out = this.data.readUInt16LE(this.offset)
		else
			out = this.data.readUInt16BE(this.offset)
		this.offset += 2
		return out
	}

	async read8signed(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 1 >= this.size)
			return 0
		out = this.data.readInt8(this.offset++)
		return out
	}

	async read8(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 1 >= this.size)
			return 0
		out = this.data.readUInt8(this.offset++)
		return out
	}

	async readFloat(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 4 >= this.size)
			return 0
		out = this.data.readFloatLE(this.offset)
		this.offset += 4
		return out
	}

	async read(size, offset)
	{
		if(offset != undefined)
			this.offset = offset
		if(this.offset + size >= this.size)
			size = this.size - this.offset
		let out = Buffer.alloc(size)
		for(let i = 0; i < size; i++)
			out[i] = this.data.readUInt8(this.offset++)
		return out
	}

	async readString(size, offset)
	{
		if(offset != undefined)
			this.offset = offset
		if(this.offset + size >= this.size)
			size = this.size - this.offset
		let out = ''
		for(let i = 0; i < size; i++)
		{
			let c = this.data.readInt8(this.offset++)
			if(!c)
			{
				this.offset += size - i - 1
				break
			}
			out += String.fromCharCode(c)
		}
		return out
	}

	async readCString(offset)
	{
		let out = ''
		if(offset != undefined)
			this.offset = offset
		let c = this.data.readUInt8(this.offset++)
		while(c && !this.eof())
		{
			out += String.fromCharCode(c)
			c = this.data.readUInt8(this.offset++)
		}
		return out
	}

	eof()
	{
		return this.offset >= this.size
	}
}

module.exports = Reader
