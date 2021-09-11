//
//
//
//

const IFF = require('./iff.js')
const FAR = require('./far.js')
const File = require('./file.js')
const fs = require('fs')

const farFilename = process.argv[2]

async function run()
{
	let far = new FAR()
	try
	{
		await far.load(new File(farFilename))
		for(let i in far.files)
		{
			console.log(far.files[i].filename)
			let file = await far.get(far.files[i].filename)
			let fileParts = far.files[i].filename.split('\\')
			if(fileParts.length > 1)
			{
				fileParts.pop()
				try
				{
					fs.mkdirSync(fileParts.join('\\'), {recursive: true})
				}
				catch(e)
				{}
			}
			fs.writeFileSync(far.files[i].filename, file.data)
		}
		//let file = await far.get('PoolTable.iff')
		//let file = await far.get('CarTown.iff')
	}
	catch(e)
	{
		console.log('Caught error')
		console.log(e)
	}
}

run()

/*
let iff = new IFF(new File('./data/GameData/Behavior.iff'))
iff.readFile((err, file) =>
{
	if(err) throw err
	for(let i in file.chunks)
	{
		let chunk = file.chunks[i]
		chunk.export()
		console.log(file.chunks[i].data)
	}
	//console.log(file)
})
/*
let iff = new IFF(new File('./data/UserData/Neighborhood.iff'))
*/

//let repackage = new Repackage()

/*
repackage.scanDir('../cds/THE_SIMS/', {recursive: true}, (err, res) =>
{

})
*/
