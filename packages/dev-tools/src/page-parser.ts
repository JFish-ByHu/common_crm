import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import type { PageDefinition } from '@common-crm/types/page'

const routePattern = /^(?:\/(?:[a-zA-Z0-9_-]+|:[a-zA-Z][a-zA-Z0-9_]*))+$/

/** 只读取语法树字面量，不执行页面代码、变量或函数。 */
export const parsePage = (source: string, filename: string) => {
  if (!source.includes('definePage')) return null
  const fail = (message: string): never => {
    throw new Error(`[definePage] ${filename}: ${message}`)
  }
  const { descriptor, errors } = parse(source, { filename })
  if (errors.length) fail(String(errors[0]))
  let result: { definition: PageDefinition; start: number; end: number } | null = null
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (!block) continue
    const ast = ts.createSourceFile(
      filename + '.ts',
      block.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    )
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && node.text === 'definePage') {
        const call = node.parent
        if (
          !ts.isCallExpression(call) ||
          call.expression !== node ||
          !ts.isExpressionStatement(call.parent) ||
          call.parent.parent !== ast ||
          block !== descriptor.scriptSetup
        ) {
          return fail(
            'definePage 只能作为 <script setup> 中独立的顶层调用，不能导入、赋值或嵌套调用'
          )
        }
        if (result) fail('每个页面只能声明一次 definePage')
        const argument = call.arguments[0]
        if (call.arguments.length !== 1 || !argument || !ts.isObjectLiteralExpression(argument)) {
          fail('参数必须是静态对象字面量')
        }
        const values: Record<string, string | boolean> = {}
        for (const property of (argument as ts.ObjectLiteralExpression).properties) {
          if (
            !ts.isPropertyAssignment(property) ||
            (property.name && ts.isComputedPropertyName(property.name))
          ) {
            fail('不支持展开、简写属性、方法或计算属性')
          }
          const assignment = property as ts.PropertyAssignment
          const name = assignment.name
          const key = ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : ''
          if (
            !['key', 'title', 'defaultPath', 'visible'].includes(key) ||
            Object.hasOwn(values, key)
          ) {
            fail(`不支持或重复的属性：${key}`)
          }
          const value = assignment.initializer
          if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))
            values[key] = value.text
          else if (value.kind === ts.SyntaxKind.TrueKeyword) values[key] = true
          else if (value.kind === ts.SyntaxKind.FalseKeyword) values[key] = false
          else fail(`${key} 必须是字符串或布尔字面量，不能引用变量`)
        }
        if (typeof values.key !== 'string' || !/^[a-z][a-z0-9-]{0,127}$/.test(values.key))
          fail('key 格式无效')
        if (typeof values.title !== 'string' || !values.title.trim() || values.title.length > 64)
          fail('title 必须为 1 至 64 字符')
        if (
          typeof values.defaultPath !== 'string' ||
          values.defaultPath.length > 255 ||
          !routePattern.test(values.defaultPath)
        ) {
          fail('defaultPath 仅支持静态路径及 /:param 形式的必填参数')
        }
        if (values.visible !== undefined && typeof values.visible !== 'boolean')
          fail('visible 必须是布尔值')
        const parameters = String(values.defaultPath)
          .split('/')
          .filter(part => part.startsWith(':'))
        if (new Set(parameters).size !== parameters.length) fail('路由参数名不能重复')
        if (parameters.length && values.visible !== false)
          fail('带参数的详情页必须声明 visible: false')
        result = {
          definition: values as unknown as PageDefinition,
          start: block.loc.start.offset + call.parent.getStart(ast),
          end: block.loc.start.offset + call.parent.getEnd()
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  return result as { definition: PageDefinition; start: number; end: number } | null
}
