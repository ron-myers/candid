import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import Pre from './app/components/Pre'

const docsComponents = getDocsMDXComponents()

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    pre: Pre,
    ...components,
  }
}
