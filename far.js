//
//
//
//

const File = require('./file.js')

class FARFile
{
	constructor()
	{
	}

	async load(file)
	{
		this.size           = await file.read32()
		this.compressedSize = await file.read32()
		this.offset         = await file.read32()
		let filenameLength  = await file.read32()
		this.filename       = await file.readString(filenameLength)
	}

	async get(file)
	{
		let data = await file.read(this.size, this.offset)
		return data

	}
}

class FAR
{
	constructor()
	{
		this.version = 0
		this.files = {}
	}

	async load(file)
	{
		this.file = file

		// Make sure file is available
		await this.file.load()

		// Read header
		let header = await this.file.readString(8)
		if(header !== 'FAR!byAZ')
			throw new Error('Not a FAR file')
		this.version = await this.file.read32()
		let fileTableOffset = await this.file.read32()
		this.file.seek(fileTableOffset)

		// Read file table
		let fileNum = await this.file.read32()
		for(let i = 0; i < fileNum; i++)
		{
			let farFile = new FARFile()
			await farFile.load(this.file)
			//console.log(farFile)
			this.files[farFile.filename] = farFile
		}

		//console.log(this.files)
	}

	async get(filename)
	{
		if(!this.files[filename])
			throw new Error('File "'+filename+'" does not exist in archive')

		let data = await this.files[filename].get(this.file)

		return new File(this.file.path+':'+filename, data)
	}
}

module.exports = FAR
