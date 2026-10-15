import { dictSubSelectListApi } from '@/apis'
import { DICT_CODE_ENUM } from '@/common/enums'
import { clearJson } from '@/common/utils'

const getDictCodes = () => {
  const result = []
  for (const key in DICT_CODE_ENUM) {
    if (Object.prototype.hasOwnProperty.call(DICT_CODE_ENUM, key)) {
      const code = DICT_CODE_ENUM[key]
      result.push(code)
    }
  }
  return result
}

const formatDicts = (dicts) => {
  const result = {}
  for (const key in dicts) {
    if (Object.prototype.hasOwnProperty.call(dicts, key)) {
      result[key] = dicts[key].map(item => ({ ...item, code: +item.code, }))
    }
  }
  return result
}

export const useDictStore = defineStore('dict', {
  state: () => ({
    loaded: false,
    dicts: {},
  }),
  actions: {
    async getDict() {
      try {
        const codes = getDictCodes()
        const r = await dictSubSelectListApi(codes)
        if (r && r.data) {
          this.loaded = true
          this.dicts = formatDicts(r.data)
        } else {
          this.loaded = true
          this.dicts = {}
        }
      } catch (e) {
        this.loaded = true
        this.dicts = {}
      }
      return this.dicts
    },
    clear() {
      clearJson(this.$state)
      this.loaded = false
    }
  }
})
