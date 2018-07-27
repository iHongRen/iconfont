/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  WebView,
  ScrollView,
  TouchableOpacity,
  AsyncStorage,
  Clipboard,
  Button,
  MenuManager,
} from 'react-native';

import * as opentype from 'opentype.js';

const AppConfig = {
  name: 'Iconfont',
  version: '1.0'
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOver: false,
      mouseOver: false,
      files: [],
      selectedFile: '',
      glyphsHtml: '',
      mapperHtml: '',
      glyphsMapperCaches: {}
    }
  }

  componentDidMount() {   
    this.parseFileStorage();
  }

  renderAppNameView() {
    return (
      <View style={styles.appNameWrap}>
        <Text style={styles.appName}>{AppConfig.name}</Text>
      </View>
    );
  }

  renderDragView() {
    const {  dragOver, mouseOver  } = this.state;
    const dragColor =  (dragOver || mouseOver) ? '#333' : 'gray';
    return (
      <View
        style={[styles.fullDragView]}
        draggedTypes={['NSFilenamesPboardType']}
        onDragEnter={() => this.setState({dragOver: true})}
        onDragLeave={() => this.setState({dragOver: false})}
        onDrop={(e) => this.onDrop(e)}
      >
        <View   
          onMouseEnter={() => this.setState({mouseOver: true})}
          onMouseLeave={() => this.setState({mouseOver: false})}
          onDragEnter={() => this.setState({dragOver: true})}
          onDragLeave={() => this.setState({dragOver: false})}
          onDrop={(e) => this.onDrop(e)}
        >
          <Text style={{fontSize: 20, color: dragColor }}>{ this.getDragTip() }</Text>               
        </View>
      </View>
    );
  }

  renderFontFileView() {
    const { files, selectedFile, dragOver, mouseOver } = this.state;
    const dragColor =  (dragOver || mouseOver) ? '#333' :  '#bbb';
    return (
      <ScrollView 
      horizontal  
      style={fileItemStyles.fontFileWrap}
      contentContainerStyle={{alignItems: 'center'}} 
      >
        {
          files.map(e => { 
            const isSelectedColor = e === selectedFile ? '#333' : '#bbb';
            return (
            <View key={e} style={fileItemStyles.fileItemWrap}>
              <TouchableOpacity activeOpacity={0.6} style={fileItemStyles.fileItem} onPress={() => this.onFileSelected(e)}>
                <View style={[fileItemStyles.fileIconWrap, {borderColor: isSelectedColor}]}>
                  <Text style={{fontSize: 40,  color: isSelectedColor}}>𝐹</Text>
                </View>
                <View style={fileItemStyles.fileNameWrap}>
                  <Text style={[fileItemStyles.fileName,{color: isSelectedColor}]} numberOfLines={1}>{e.split('/').pop()}</Text>
                </View>             
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.6} style={[fileItemStyles.fileClose, {backgroundColor: isSelectedColor}]} onPress={() => this.onDeleteFileItem(e)}>
                <Text style={fileItemStyles.fileCloseIcon}>✕</Text>
              </TouchableOpacity>                                         
            </View>
            )}
          )        
        }
         <View
          style={{marginLeft: 20}}   
          onMouseEnter={() => this.setState({mouseOver: true})}
          onMouseLeave={() => this.setState({mouseOver: false})}
        >
          <Text style={{color: dragColor}}>{ this.getDragTip()}</Text>
        </View>
      </ScrollView>
    );    
  }

  renderJsonMapperView() {
    return (
      <View style={panelStyles.mapperView}>
      <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
        <Button
          style={{ width: 60, height: 25, }}
          title={'copy'}
          bezelStyle={'rounded'}
          onPress={() => alert(`clicked`)}
        />
      </View>
       <WebView 
          source={{html: this.state.mapperHtml}} 
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
        />
      </View>
    );
  }

  renderPanelView() {
    const { glyphsHtml, dragOver } = this.state;
    const dragColor =  dragOver ? '#bbb' : '#fff';

    return (
      <View style={{flex: 1}}>
        <View></View>
        <View style={[panelStyles.fileHeaderView, {borderColor: dragColor}]}
            draggedTypes={['NSFilenamesPboardType']}         
            onDragEnter={() => this.setState({dragOver: true})}
            onDragLeave={() => this.setState({dragOver: false})}
            onDrop={(e) => this.onDrop(e)}
          >
          { this.renderFontFileView() }
        </View>
        <View style={panelStyles.fontShowView}>         
          <View style={panelStyles.fontShow}>
            <WebView 
              source={{html: glyphsHtml}} 
              onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
            />
          </View> 
          { this.renderJsonMapperView() }          
        </View>
      </View>
    );
  }

  render() {  
    return (
      <View style={styles.container}> 
        { this.renderAppNameView() }        
        { this.state.files.length === 0 ? this.renderDragView() : this.renderPanelView() }
      </View>
    );
  }

  addAboutItem() {
    MenuManager.addAboutItem();
  }

  onCopyMapper(jsonText) {
    Clipboard.setString(jsonText);
  }

  onShouldStartLoadWithRequest = (event) => {
    console.log(event);
    return false;
  };

  onFileSelected(file) {
    console.log(file);
    const { files, selectedFile } = this.state;
    if (selectedFile === file) return;
    this.parseFile(file, files);
  }

  onDeleteFileItem(file) {
    const { files, selectedFile } = this.state;
    const deleteIndex = files.indexOf(file);    
    const newFiles = files.filter(e => e != file);
    this.state.glyphsMapperCaches[file] = null;
    this.storageFiles(newFiles);
    if (newFiles.length === 0) {
      this.loadFileGlyphs();     
      return; 
    }

    if (file === selectedFile) {
      let newSelectedFile = ''; 
      if (deleteIndex === 0) {
        newSelectedFile = newFiles[0];
      } else if (deleteIndex === (files.length - 1)) {
        newSelectedFile = newFiles[newFiles.length-1];
      } else {
        newSelectedFile = newFiles[deleteIndex];
      }
      this.parseFile(newSelectedFile, newFiles);      
    } else {
      this.setState({
        files: newFiles,
      }); 
    }    
  }

  onDrop(e) {
    console.log(e.nativeEvent);
    this.setState({ dragOver: false });

    let files = e.nativeEvent.files;
    files = this.filteredTTFFiles(files);

    if(files.length === 0) return;
    this.parseFile(files[0], [...this.state.files, ...files]);
  }

  filteredTTFFiles(files) {
    let oFiles = this.state.files;
    return files.filter(e => {
      return e.endsWith('.ttf') && !oFiles.includes(e);
    });
  }

  parseFile(file, files) {
    const glyphsMapper = this.state.glyphsMapperCaches[file];
    if (glyphsMapper) {
      const { glyphs, mapper } = glyphsMapper;
      this.loadFileGlyphs(file, files, glyphs, mapper);
      return;
    }

    opentype.load(file, (err, font) => {
      if (err) {
        console.warn(err);
        return;
      }

      const glyphs = this.getConfigGlyphs(font.glyphs);
      const hasNames = glyphs.some(e => !!(e.name));
      const mapper = hasNames ? this.parseMapper(glyphs) : this.getUnicodeHexs(glyphs);
      
      this.state.glyphsMapperCaches[file] = { glyphs, mapper };        
      this.loadFileGlyphs(file, files, glyphs, mapper);
      this.storageFiles(files);

      console.log(this.state.glyphsMapperCaches);
    });  
  }

  getConfigGlyphs(fontGlyphs) {
    let glyphs = []    
    for (let i = 0; i < fontGlyphs.length; i++) {
      let glyph = fontGlyphs.get(i);
      if(this.filteredNullGlyph(glyph)) {
        let path = glyph.getPath(0, 40, 40);

        let myGlyph = {};
        myGlyph.svg = path.toSVG();
        myGlyph.hex = this.toHex(glyph.unicode);
        myGlyph.name = glyph.name;
        glyphs.push(myGlyph); 
      }        
    }
    return glyphs;
  }

  loadFileGlyphs(selectedFile = '', files = [], glyphs = [], mapper = {}) {
    console.log(selectedFile);
    console.log(files);
    const mapperHtml = this.getMapperHtml(mapper);
    const glyphsHtml = this.getGlyphWrapperHtml(glyphs);
    this.setState({
      glyphsHtml: glyphsHtml,
      mapperHtml: mapperHtml,
      selectedFile: selectedFile,
      files: files
    });
  }

  filteredNullGlyph(glyph) {
    const { xMax, xMin, yMax, yMin } = glyph;
    return !!xMax || !!xMin || !!yMax || !!yMin;
  }

  toHex(unicode) {
    if(unicode == undefined) return undefined;
    let hex = unicode.toString(16);  
    while(hex.length < 4) {
      hex = '0' + hex; 
    } 
    return hex;
  } 

  parseMapper(glyphs) {
    return glyphs.filter(e => !!e.name && !!e.hex).reduce((prev, cur) => {
       prev[cur.name] = `${cur.hex}`;
       return prev;
    },{});
  }

  getUnicodeHexs(glyphs) {
    return glyphs.filter(e => !!e.hex).map(e => e.hex);
  }

  getGlyphHtml(glyph, index) {
    const { svg, name, hex } = glyph;
    const glyphTop = index < 3 ? 'glyph-top' : '';
    const glyphLeft = index%3 === 0 ? 'glyph-left' : '';
    const hexu = !!hex ? `\\u${hex}`: '';
    const hexx = !!hex ? `&#x${hex};` : '';
    return (
      `<div class="glyph ${glyphTop} ${glyphLeft}">
        <div>${index+1}</div>
        <svg class="glyph-svg">          
          ${svg}
        </svg>
        <p>${name || ''}</p>
        <code>${hexu}</code>
        <xmp>${hexx}</xmp>
      </div>`
    );
  }
 
  getGlyphWrapperHtml(glyphs) {
    return (
      `<div class="warpper">
        ${glyphs.reduce((prev, cur, index) => prev + this.getGlyphHtml(cur, index),'')}
      </div> 
      ${glyphWrapStyles}`
    );
  }

  getMapperHtml(mapper) {   
    let jsonText = JSON.stringify(mapper, null, 2);
    return `<pre class='mapper'>${this.syntaxHighlight(jsonText)}</pre>${JsonStyles}`;
  }

  syntaxHighlight(jsonText) {
    let text = jsonText.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const regx = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    return text.replace(regx, (match) => {
      let cls = 'number';
      if (/^"/.test(match)) {
        const isKey = /:$/.test(match);
        cls = isKey ? 'key' : 'string'; 
        match = isKey ? match : '\"\\u' + match.replace('\"','');       
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return `<span class=${cls}>${match}</span>`;
    });
  }

  getDragTip() {
    return this.state.dragOver ? 'Release to open' : 'Drop .ttf files here';
  }

  parseFileStorage() {
    AsyncStorage.getItem('FileNameStorageKey').then(filesJson => {
      const files = JSON.parse(filesJson);
      if (Array.isArray(files) && files.length > 0) {
        this.parseFile(files[0], files);
      }
    });
  }

  storageFiles(files) {
    AsyncStorage.setItem('FileNameStorageKey', JSON.stringify(files));
  }
}

const fileItemStyles = StyleSheet.create({
  fontFileWrap: {
    flex: 1,
    marginHorizontal: 10,   
  },
  fileItemWrap: {
    width: 100,
    marginRight: 15,
    marginTop: 10
  },  
  fileItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },  
  fileIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    width: 80,
    height: 100,
    marginTop: 5
  },
  fileNameWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5
  },
  fileName: {
    fontSize: 14,
    textAlign: 'center',
  },
  fileClose: {
    alignSelf: 'flex-end',
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',  
    position: 'absolute',
    right: 1,
    top: 0,
    borderRadius: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#fff',
  },
  fileCloseIcon: {
    fontSize: 13,
    color: '#fff'
  },  
});

const panelStyles = StyleSheet.create({ 
  fileHeaderView: {
    marginHorizontal: 15,
    flexDirection: 'row',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'red',
    height: 150,
    backgroundColor: '#fff',
  },
  fontShowView: {
    flex: 1,
    marginVertical: 15,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fontShow: {
    flex: 1,
    flexGrow: 2,
  },
  mapperView: {
    flex: 1,
    flexGrow: 1,
    marginLeft: 15,
    backgroundColor: '#fff'
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  appNameWrap: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  appName: {
    marginVertical: 5,
    fontSize: 15,
    color: '#333',
  },  
  fullDragView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

const glyphWrapStyles = 
`<style> 
  .glyph {
    padding: 10px 15px 10px 15px;
    width: 33.333333%;
    border-bottom: 1px solid lightgray;
    border-right: 1px solid lightgray; 
    -webkit-box-sizing:border-box;
  }
  .glyph-top { border-top: 1px solid lightgray; }
  .glyph-left { border-left: 1px solid lightgray; }  
  .glyph-svg {
    margin-top: 10px;
    width: 50px;
    height: 50px;       
  }
  .warpper {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  p {
    white-space: nowrap;
    text-overflow: ellipsis; 
    overflow: hidden;     
  }        
</style>`;

const JsonStyles = 
`<style>
  .mapper { padding: 5px; margin: 5px; }
  .string { color: green; }
  .number { color: darkorange; }
  .boolean { color: blue; }
  .null { color: magenta; }
  .key { color: #CD2626; }
</style>`;
