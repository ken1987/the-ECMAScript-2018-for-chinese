const glob = require('glob')
const fs = require('fs-extra')
const { docs } = require('./config')

const regFilterNumber = new RegExp(`^${docs}\\/|\\.md$`, 'gi')

const readFileContent = file =>
  fs.readFile(file).then((data) => {
    const number = file.replace(regFilterNumber, '')
    const title = data
      .toString()
      .trim()
      .split('\n')[2]
    return {
      title: title ? title.replace(/^# /, '') : '',
      number
    }
  })

const getTree = (map) => {
  const reg = /^\d+$/
  const r = /^(\d+\.)+/
  const r2 = /\.\d+$/

  map.forEach((item) => {
    const { number } = item
    if (reg.test(number)) return
    map.forEach((n) => {
      const nb = n.number
      if (number.replace(r2, '') === nb) {
        let needSort = true
        if (!n.children) {
          n.children = []
          needSort = false
        }

        n.children.push(item)

        if (needSort) {
          n.children = n.children.sort((a, b) => a.number.replace(r, '') - b.number.replace(r, ''))
        }
      }
    })
  })

  return map.filter(item => reg.test(item.number)).sort((a, b) => a < b)
}

const getContent = (tree, level = 0) => {
  // 缩进
  let tab = ''
  for (let i = 0; i < level; i++) {
    tab += '  '
  }

  // 内容
  let str = ''

  // 第一层额外内容
  if (!level) {
    str += '# Summary \n\n'
  }

  // 循环内容
  str += tree
    .map(({ title, number, children }) => {
      let s = `${tab}* [${title}](${docs}/${number}.md)\n`

      if (children) {
        s += getContent(children, level + 1)
      }

      return s
    })
    .join('')

  return str
}

const files = glob.sync(`${docs}/*.md`)
const results = files.map(file => readFileContent(file))

Promise.all(results).then((items) => {
  const tree = getTree(items)
  const content = getContent(tree)

  fs.writeFile('SUMMARY.md', content).catch((err) => {
    console.error(err)
  })
})
