//
//
//
//

const Chunk = require('./chunk.js')

class Instruction
{
	constructor(opcode, tDest, fDest, data)
	{
		this.opcode = opcode
		this.tDest = tDest
		this.fDest = fDest
		this.data = data
	}
}

class BHAV extends Chunk
{
	constructor()
	{
		super()
		this.version = 0
		this.count   = 0
		this.bType   = 0
		this.args    = 0
		this.locals  = 0
		this.flags   = 0
		this.unknown = 0
		this.zero = 0
		this.instructions = []
	}

	async readChunk(reader)
	{
		this.version = await reader.read16()

		if(this.version == 0x8000)
		{
			this.count   = await reader.read16()
			this.zero    = await reader.read(8)
		}
		else if(this.version == 0x8001)
		{
			this.count   = await reader.read16()
			this.unknown = await reader.read(8)
		}
		else if(this.version == 0x8002)
		{
			this.count   = await reader.read16()
			this.bType   = await reader.read8()
			this.args    = await reader.read8()
			this.locals  = await reader.read16()
			this.flags   = await reader.read16()
			this.zero    = await reader.read16()
		}
		else if(this.version == 0x8003)
		{
			this.bType   = await reader.read8()
			this.args    = await reader.read8()
			this.locals  = await reader.read8()
			this.unknown = await reader.read16()
			this.flags   = await reader.read16()
			this.count   = await reader.read32()
		}

		for(let i = 0; i < this.count; i++)
		{
			this.instructions.push(new Instruction(await reader.read16(), await reader.read8(), await reader.read8(), await reader.read(8)))
		}
	}

	export()
	{
		return ''
	}
}

module.exports = BHAV
