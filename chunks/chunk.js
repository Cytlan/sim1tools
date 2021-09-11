
const Reader = require('../reader.js')

const ChunkTypes = {
	'STR#': './str.js',
	'SPR2': './spr2.js',
	'OBJD': './objd.js',
	'DGRP': './dgrp.js',
	'PALT': './palt.js',
	'BHAV': './bhav.js',
	'OBJf': './objf.js',
}

class Chunk
{
	constructor()
	{
		this.type  = 'NULL'
		this.id    = 0
		this.flags = 0
		this.label = ''
	}

	async read(reader)
	{
		this.type    = await reader.readString(4)
		let size     = await reader.read32()
		this.id      = await reader.read16()
		this.flags   = await reader.read16()
		this.label   = await reader.readString(64)
		let dataSize = size - 76
		let chunkReader = new Reader(await reader.read(dataSize))
		await this.readChunk(chunkReader)
	}

	async readChunk(reader)
	{

	}

	static async factory(reader)
	{
		let type = await reader.readString(4)
		reader.rewind(4)

		let chunkDef = ChunkTypes[type] ? require(ChunkTypes[type]) : Chunk
		let chunk = new chunkDef()
		await chunk.read(reader)
		return chunk
	}
}

module.exports = Chunk
