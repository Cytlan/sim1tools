//
// PALT chunk parser
//
// This chunk contains palette data
//

const Chunk = require('./chunk.js')

class PALT extends Chunk
{
	constructor()
	{
		super()
		this.version    = 0
		this.colorCount = 0
		this.reserved1  = 0
		this.reserved2  = 0
		this.colors     = []
	}

	async readChunk(reader)
	{
		this.version    = await reader.read32()
		this.colorCount = await reader.read32()
		this.reserved1  = await reader.read32()
		this.reserved2  = await reader.read32()
		for(let i = 0; i < this.colorCount; i++)
			this.colors.push(await reader.read24())
	}

	getColor(index)
	{
		return this.colors[index] ?? 0
	}
}

module.exports = PALT
