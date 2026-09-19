import type { MicroAppProps } from '@common-crm/types'

let currentProps: MicroAppProps = {}

export function getMicroAppProps(): MicroAppProps {
  return currentProps
}

export function setMicroAppProps(props: MicroAppProps): void {
  currentProps = props
}

export function clearMicroAppProps(): void {
  currentProps = {}
}
