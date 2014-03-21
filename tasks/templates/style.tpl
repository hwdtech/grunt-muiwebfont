// Variables
<%for(var glyphIdx = 0; glyphIdx < glyphs.length; glyphIdx++) {%>$<%=glyphs[glyphIdx]%>:'\<%=codepoints[glyphIdx]%>';
<%}%>

.glyph {
  &:before {
    font-family: 'Modern UI Icons';
    font-size: <%= fontSize %>px;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    font-weight: normal;
    font-style: normal;
    speak: none;
    text-decoration: inherit;
    text-transform: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
