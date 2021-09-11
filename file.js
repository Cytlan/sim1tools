//
//
//
//

const fs = require('fs/promises')

class File
{
	constructor(path, data)
	{
		this.isLoaded = false
		this.data = undefined
		this.stats = undefined
		this.exists = undefined
		if(path)
		{
			this.path = path
			this.filename = path.split('/').pop()
			this.basename = this.filename.split('.')
			this.basename.pop()
			this.basename = this.basename.join('.')
			this.extension = this.filename.split('.').pop().toLowerCase()
		}
		else
		{
			this.path = ''
			this.filename = ''
			this.extension = ''
		}

		if(data)
		{
			this.isLoaded = true
			this.data = data
			this.size = data.length
		}

		this.offset = 0
		this.endian = 0 // 0: little, 1: big
	}

	/*
	setData(data)
	{
		this.isLoaded = true
		this.data = data
		this.size = data.length
	}
	*/

	async stat()
	{
		try
		{
			let stat = await fs.stat(this.path)
			this.stats = stat
			this.exists = true
		}
		catch(e)
		{
			this.exists = false
		}
	}

	async load()
	{
		if(this.isLoaded)
			return true

		await this.stat()
		if(!this.exists)
		{
			this.isLoaded = false
			this.data = undefined
			throw new Error('File does not exist')
		}
		this.data = await fs.readFile(this.path)
		this.isLoaded = true
		this.size = this.data.length
		return true
	}

	async write(path, callback)
	{
		if(path[path.length - 1] != '/')
			path += '/'
		console.log(this)
		fs.writeFile(path+this.filename, this.data, (err, res) =>
		{
			callback(err, res)
		})
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

	async read32(offset)
	{
		let out = 0
		if(offset != undefined)
			this.offset = offset
		if(this.offset + 4 >= this.size)
			return this.read16()
		if(!this.endian)
			out = this.data.readUInt32LE(this.offset)
		else
			out = this.data.readUInt32BE(this.offset)
		this.offset += 4
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

module.exports = File
