//
//
//
//


function ParseINI(data)
{
	if(data instanceof Buffer)
		data = data.toString('utf8')

	let sections = {}
	let sectionName = ''

	data = data.replace(/\r/g, '')
	let lines = data.split('\n')

	for(let i in lines)
	{
		let line = lines[i].trim()

		// Remove comments
		line = line.split(';').shift()

		// Sections
		if(line[0] == '[')
		{
			let m = line.match(/\[(.*?)\]/)
			if(m[1])
			{
				sectionName = m[1]
				if(!sections[sectionName])
					sections[sectionName] = {}
			}
			else
				sectionName = ''
		}

		// Key/Value's
		else if(line.indexOf('=') != -1)
		{
			if(!sections[sectionName])
				sections[sectionName] = {}

			let m = line.match(/(.*?)=(.*)/)
			sections[sectionName][m[1]] = m[2]
		}
	}

	return sections
}

module.exports = ParseINI
