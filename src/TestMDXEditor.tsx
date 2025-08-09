import { MDXEditor, headingsPlugin } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

export default function TestMDXEditor() {
  return <MDXEditor markdown="# Hello world" plugins={[headingsPlugin()]} />
}
