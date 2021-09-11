//
//
//
//

const Chunk = require('./chunk.js')

class STR extends Chunk
{
	constructor()
	{
		super()
		this.version = 0
		this.strings = []
	}

	async readChunk(reader)
	{
		this.version = await reader.read8()
		let stringCount = 0
		if(this.version != 0)
		{
			this.version |= await reader.read8() << 8
			stringCount = await reader.read16()
		}
		else
			stringCount = await reader.read8()

		for(let i = 0; i < stringCount; i++)
		{
			switch(this.version)
			{
				case 0x0000:
					let len = await reader.read8()
					this.strings.push(await reader.readString(len))
					break;

				case 0xFFFF:
					this.strings.push(await reader.readCString())
					break;

				case 0xFFFE:
					this.strings.push([await reader.readCString(), await reader.readCString()])
					break;

				case 0xFFFD:
					let o = []
					let lang = await reader.read8() // Language code
					o.push(lang)
					o.push(await reader.readCString())
					o.push(await reader.readCString())
					this.strings.push(o)
					break;
				default:
					break;
			}
		}
	}

	export()
	{
		let o = 'Type: STR#\n'
		o += '\n'
		for(let i = 0; i < this.strings.length; i++)
		{
			let strList = this.strings[i]
			o += strList.join('\n')+'\n'
		}
		return o
	}
}

module.exports = STR
