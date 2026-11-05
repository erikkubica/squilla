package rendering

import (
	"io"
	texttemplate "text/template"
)

// RenderText executes code as a text/template (no HTML auto-escaping)
// with the renderer's base functions plus funcMap. It exists for theme
// templates whose output is not HTML — e.g. structured-data templates
// that emit JSON — where html/template's contextual escaping would turn
// quotes into &#34;. Callers own validation of the output.
func (r *TemplateRenderer) RenderText(w io.Writer, name string, code string, data interface{}, funcMap map[string]interface{}) error {
	fm := texttemplate.FuncMap{}
	for k, v := range r.funcMap {
		fm[k] = v
	}
	for k, v := range funcMap {
		fm[k] = v
	}
	tmpl, err := texttemplate.New(name).Funcs(fm).Parse(code)
	if err != nil {
		return err
	}
	return tmpl.Execute(w, data)
}
