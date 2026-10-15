// todo: 可以在一个文件内写这些数据，分文件夹是因为都在一个文件内数据太多看起来有点累

// todo: 手动导入
// import home from './home'
// import demo from './demo'
// import user from './user'
// import system from './system'
// import infrastructure from './infrastructure'
// import personal from './personal'
// export const permissions = [
//   ...home,
//   ...demo,
//   ...user,
//   ...system,
//   ...infrastructure,
//   ...personal,
// ]
// 自动导入菜单权限定义：当前演示仅保留 wms 模块，其余模块保留后期联调位置
const modulesSort = ['wms']
// const modulesSort = ['wms', 'home', 'demo', 'user', 'system', 'infrastructure', 'personal']
export const permissions = []
const permissionFiles = import.meta.glob('./*/index.js', { eager: true })

// 收集所有模块菜单
for (const name of modulesSort) {
  const filePath = `./${name}/index.js`
  if (permissionFiles[filePath]) {
    const list = permissionFiles[filePath].default || []
    permissions.push(...list)
  }
}
