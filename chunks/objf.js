//
//
//
//

const Chunk = require('./chunk.js')

class OBJF extends Chunk
{
	constructor()
	{
		super()
		this.count     = 0
		this.functions = []
	}

	async readChunk(reader)
	{
		this.count = await reader.read32()

	}

	export()
	{
		return ''
	}
}

module.exports = OBJF
