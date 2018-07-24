/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  WebView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  AsyncStorage,
  TextInput
} from 'react-native';

import * as opentype from 'opentype.js';


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOver: false,
      mouseOver: false,
      files: [],
      glyphs: [],
      mapperText: '',
      selectedFile: '',
    }
  }

  componentDidMount() {
    this.getStorageFile((files)=> {
      this.parseFile(files[0], (glyphs)=> {
        this.reloadFiles(files);
        this.reloadGlyphs(glyphs);      
      });
    });
  }

  renderAppNameView() {
    return (
      <View style={styles.appNameWrap}>
        <Text style={styles.appName}>Iconfont 1.0</Text>
      </View>
    );
  }

  renderDragView() {
    const { files, dragOver, mouseOver  } = this.state;
    const dragColor =  dragOver ? 'yellow' : (mouseOver ? 'orange' : '#F5FCFF');
    return (
      <View
        style={[styles.fullDragView ,{backgroundColor: dragColor}]}
        draggedTypes={['NSFilenamesPboardType']}
        onMouseEnter={() => this.setState({mouseOver: true})}
        onMouseLeave={() => this.setState({mouseOver: false})}
        onDragEnter={() => this.setState({dragOver: true})}
        onDragLeave={() => this.setState({dragOver: false})}
        onDrop={(e) => this.onDrop(e)}>
        <Text style={{fontSize: 14, color: 'black'}}>
          {files.length > 0 ? files : 'Drag here a file'}
        </Text>        
      </View>
    );
  }

  renderFontFileView() {
    const { files, selectedFile } = this.state;
    return (
      <ScrollView 
      horizontal  
      style={fileItemStyles.fontFileWrap}
      contentContainerStyle={fileItemStyles.fontFileContainerItem} 
      >
        {
          files.map((e)=> { 
            const isSelectedColor = e === selectedFile ? 'orange' : '#ddd';
            return (
            <View key={e} style={fileItemStyles.fileItemWrap}>
              <TouchableOpacity activeOpacity={0.7} style={fileItemStyles.fileItem} onPress={()=> this.onFileSelected(e)}>
                <View style={[fileItemStyles.fileIconWrap, {borderColor: isSelectedColor}]}>
                  <Text style={{fontSize: 40,  color: isSelectedColor}}>𝐹</Text>
                </View>
                <View style={fileItemStyles.fileNameWrap}>
                  <Text style={[fileItemStyles.fileName,{color: isSelectedColor}]} numberOfLines={1}>{e.split('/').pop()}</Text>
                </View>             
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={fileItemStyles.fileClose} onPress={()=> this.onDeleteFileItem(e)}>
                <Text style={fileItemStyles.fileCloseIcon}>✕</Text>
              </TouchableOpacity>                                         
            </View>
            )}
          )        
        }
      </ScrollView>
    );    
  }

  renderJsonMapperView() {
    return (
      <View style={panelStyles.mapperView}>
<ScrollView >
        <View style={{flex: 1, backgroundColor: '#fff'}}>
          <Text style={{flex: 1, backgroundColor: '#fff'}} selectable={true}>
            {this.state.mapperText}
          </Text>
        </View>
      </ScrollView>
      </View>
      
      // <View style={panelStyles.mapperView}>
      //   <TextInput 
      //   style={panelStyles.jsonView}
      //   editable={false}
      //   multiline
      //   value={jsonText}
      //   />
      // </View> 
    );
  }

  renderPanelView() {
    const { glyphs } = this.state;
    const { files, dragOver, mouseOver  } = this.state;
    const dragColor =  dragOver ? 'orange' :  '#ddd';
    let html = this.getGlyphWrapperHtml(glyphs);
    return (
      <View style={panelStyles.panelView}>
        <View style={[panelStyles.headerView, {borderColor: dragColor}]}
            draggedTypes={['NSFilenamesPboardType']}
            onMouseEnter={() => this.setState({mouseOver: true})}
            onMouseLeave={() => this.setState({mouseOver: false})}
            onDragEnter={() => this.setState({dragOver: true})}
            onDragLeave={() => this.setState({dragOver: false})}
            onDrop={(e) => this.onDrop(e)}
          >
          { this.renderFontFileView() }
        </View>

        <View style={panelStyles.fontShowView}>         
          <View style={panelStyles.fontShow}>
            <WebView source={{html:html}} />
          </View> 
          { this.renderJsonMapperView(glyphs) }          
        </View>
      </View>
    );
  }

  render() {  
    return (
      <View style={styles.container}> 
        { this.renderAppNameView() }
        { (this.state.files.length === 0) ? this.renderDragView() : this.renderPanelView() }
      </View>
    );
  }

  onFileSelected(file) {
    this.parseFile(file, (glyphs)=> {
      this.setState({
        selectedFile: file
      });
      this.reloadGlyphs(glyphs);     
    });
  }

  onDeleteFileItem(file) {
    const { files, selectedFile } = this.state;
    const deleteIndex = files.indexOf(file);    
    const newFiles = files.filter(e => e != file);
    if (newFiles.length === 0) {
      this.reloadFiles([], '');
      this.reloadGlyphs([]);
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

      this.parseFile(selectedFile, (glyphs)=> {    
        this.reloadGlyphs(glyphs);
        this.reloadFiles(newFiles, newSelectedFile)     
      });   
    }     
  }

  onDrop(e) {
    console.log(e.nativeEvent);
    let files = e.nativeEvent.files;
    files = this.filteredTTFFiles(files);
    if(files.length === 0) return;
    this.setState({
      dragOver: false
    });

    this.parseFile(files[0], (glyphs)=> {
      this.setStorageFile(files);     
      this.reloadFiles([ ...files, ...this.state.files]);
      this.reloadGlyphs(glyphs);      
    });    
  }

  filteredTTFFiles(files) {
    return files.filter(e => e.endsWith('.ttf'));
  }

  parseFile(file, success) {
    opentype.load(file, (err, font)=> {
      if (err) {
        console.warn(err);
        return;
      }
      console.log(font);
      const fontGlyphs = font.glyphs;
      let glyphs = []    
      for (let i = 0; i < fontGlyphs.length; i++) {
        let glyph = fontGlyphs.get(i);
        let path = glyph.getPath(0, 40, 40);
        glyph.svg = path.toSVG();
        glyph.hex = this.toHex(glyph.unicode);
        glyphs.push(glyph); 
      }
      console.log(glyphs);
      success && success(glyphs);  
    });  
  }

  toHex(unicode) {
    if(unicode == undefined) return undefined;
    let hex = unicode.toString(16);  
    while(hex.length < 4) {
      hex = '0' + hex; 
    } 
    return hex;
  } 

  parseMapperGlyphs(glyphs) {
    const mapperText = glyphs.filter(e=> e.name && e.unicode).map(e=> `  ${e.name}: ${e.unicode},`).join('\n');
    return `{\n${mapperText}\n}`;
  }

  reloadGlyphs(glyphs) {
    this.setState({
      glyphs: glyphs,
      mapperText: this.parseMapperGlyphs(glyphs)
    });
  }

  reloadFiles(files, selectedFile = files[0]) {
    this.setState({
      files: files,
      selectedFile: selectedFile
    })
  }

  getGlyphHtml(glyph) {
    const { svg, name, hex, unicode, index } = glyph;
    const glyphTop = index < 3 ? 'glyph-top' : '';
    const glyphLeft = index%3 === 0 ? 'glyph-left' : '';
    return (
      `<div class="glyph ${glyphTop} ${glyphLeft}">
        <div> ${index} </div>
        <svg class="glyph-svg">          
          ${svg}
        </svg>
        <p> ${name} </p>
        <p> ${hex}  /  ${unicode}</p>
      </div>`
    );
  }
 
  getGlyphWrapperHtml(glyphs) {
    return (
      `<div class="warpper">
        ${glyphs.reduce((pre, cur)=> pre + this.getGlyphHtml(cur),'')}
      </div> 
      ${glyphWrapStyles}
      `
    );
  }

  getStorageFile(success) {
    AsyncStorage.getItem('FileNameStorageKey').then(filesJosn => {
      files = JSON.parse(filesJosn);
      if (files !== null && files.length > 0) {
        success && success(files);        
      }
    });
  }

  setStorageFile(files) {
    AsyncStorage.setItem('FileNameStorageKey', JSON.stringify(files));
  }
}

const fileItemStyles = StyleSheet.create({
  fontFileWrap: {
    flex: 1,
    marginHorizontal: 10,   
  },
  fontFileContainerItem: {
    alignItems: 'center',
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
    width: 80,
    height: 100,
    marginTop: 5
  },
  fileIcon: {
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 15
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',  
    backgroundColor: '#000',
    position: 'absolute',
    right: 0,
    top: 0,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#fff',
  },
  fileCloseIcon: {
    fontSize: 15,
    color: '#fff'
  },  
});

const panelStyles = StyleSheet.create({
  panelView: {
    flex: 1,
  },
  headerView: {
    marginTop: 0,
    marginHorizontal: 15,
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    height: 150,
    backgroundColor: '#fff'
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
    marginLeft: 0,
    marginBottom: 0,
    marginTop: 0,
    flexGrow: 2,
    backgroundColor: '#0f0'
  },
  mapperView: {
    flex: 1,
    flexGrow: 1,
    marginLeft: 15,
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  jsonView: {
    color: 'orange',
    fontSize: 15,
    height: 150,
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    overflow: 'hidden'
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

const glyphWrapStyles = `
<style> 
  .glyph {
    padding: 10px 15px 10px 15px;
    width: 33.333333%;
    border-bottom: 1px solid lightgray;
    border-right: 1px solid lightgray; 
    -webkit-box-sizing:border-box;     
  }
  .glyph-top {
    border-top: 1px solid lightgray; 
  }
  .glyph-left {
    border-left: 1px solid lightgray; 
  }  
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
</style>
`;