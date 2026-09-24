import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
  RequestMethod
} from '@nestjs/common'
import { DiscoveryService, MetadataScanner } from '@nestjs/core'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import type { ApiPermissionRule, PermissionHttpMethod } from '@common-crm/types/api'
import { endpointKey, PUBLIC_ENDPOINTS, SESSION_ENDPOINTS } from '../types'
import { AuthorizationRepository } from '../repositories'

@Injectable()
export class EndpointCatalogService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(EndpointCatalogService.name)
  private endpoints: ApiPermissionRule[] = []

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly repository: AuthorizationRepository
  ) {}

  onModuleInit() {
    const result = new Map<string, ApiPermissionRule>()
    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper
      if (!instance || !metatype) continue
      const controllerPath: string | string[] = Reflect.getMetadata(PATH_METADATA, metatype) ?? ''
      const prototype = Object.getPrototypeOf(instance) as Record<string, object>
      for (const name of this.scanner.getAllMethodNames(prototype)) {
        const method = prototype[name]
        const methodId: RequestMethod | undefined = Reflect.getMetadata(METHOD_METADATA, method)
        const routePath: string | string[] | undefined = Reflect.getMetadata(PATH_METADATA, method)
        if (methodId === undefined || routePath === undefined) continue
        const httpMethod = RequestMethod[methodId] as PermissionHttpMethod
        if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(httpMethod)) continue
        for (const base of [controllerPath].flat())
          for (const route of [routePath].flat()) {
            const path = '/' + [base, route].join('/').split('/').filter(Boolean).join('/')
            const rule = { httpMethod, path }
            const key = endpointKey(rule)
            if (!PUBLIC_ENDPOINTS.has(key) && !SESSION_ENDPOINTS.has(key)) result.set(key, rule)
          }
      }
    }
    this.endpoints = [...result.values()].sort((a, b) =>
      endpointKey(a).localeCompare(endpointKey(b))
    )
  }

  list(): ApiPermissionRule[] {
    return this.endpoints
  }

  /** 在开始接收请求前，清理已不属于当前业务路由清单的接口绑定。 */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.endpoints.length) {
      throw new Error('业务接口清单为空，已中止权限绑定清理和应用启动')
    }
    const deletedCount = await this.repository.deleteStaleEndpointRules(this.endpoints)
    if (deletedCount) this.logger.log(`已清理 ${deletedCount} 条失效接口绑定并更新权限版本`)
  }

  contains(rule: ApiPermissionRule): boolean {
    return this.endpoints.some(item => endpointKey(item) === endpointKey(rule))
  }
}
