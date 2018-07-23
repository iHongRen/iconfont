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
  AsyncStorage
} from 'react-native';
import * as opentype from 'opentype.js';

const size = Dimensions.get('window');
const windowWidth = size.width;
const windowHeight = size.height;
console.log(size);
console.log(Dimensions.get('screen'));

const FileStorageKey = 'FileStorageKey';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOver: false,
      mouseOver: false,
      files: [],
      glyphs: [],
      selectedIndex: 0,
    }
  }

  componentDidMount() {
    AsyncStorage.getItem(FileStorageKey).then(filesJosn => {
      files = JSON.parse(filesJosn);
      if (files !== null) {
        this.setState({
          files: files
        });
      }
    })
  }

  renderDragView() {
    const { files, dragOver, mouseOver  } = this.state;
    const dragColor =  dragOver ? 'yellow' : (mouseOver ? 'orange' : 'white');
    return (
      <View
        style={[styles.dragView ,{backgroundColor: dragColor}]}
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
    const { files } = this.state;
    return (
      <ScrollView style={styles.fontFileWrap} contentContainerStyle={styles.fontFileContainerWrap}>
        {
          files.map((e, index)=> { return (
            <View key={index} style={styles.fileItemWrap}>
              <View style={styles.fileItem}>
                <TouchableOpacity style={styles.fileIconWrap} onPress={()=> this.onFileSelected(index)}>
                  <Text>图片</Text>
                </TouchableOpacity>
                <View style={styles.fileNameWrap}>
                  <Text style={styles.fileName}>{e.split('/').pop()}</Text>
                </View>             
              </View>
              <TouchableOpacity style={styles.fileClose} onPress={()=> this.onDeleteFileItem(index)}>
                <Text style={styles.fileCloseIcon}>✕</Text>
              </TouchableOpacity>                                         
            </View>
            )}
          )        
        }
      </ScrollView>
    );
    
  }

  render() {  
    const { glyphs } = this.state;
    const { files, dragOver, mouseOver  } = this.state;
    const dragColor =  dragOver ? 'yellow' : (mouseOver ? 'orange' : 'white');
    let html = this.getGlyphWrapperHtml(glyphs);
    return (
      <View style={styles.container}> 
        <View style={[styles.headerView, {borderColor: dragColor}]}
          draggedTypes={['NSFilenamesPboardType']}
          onMouseEnter={() => this.setState({mouseOver: true})}
          onMouseLeave={() => this.setState({mouseOver: false})}
          onDragEnter={() => this.setState({dragOver: true})}
          onDragLeave={() => this.setState({dragOver: false})}
          onDrop={(e) => this.onDrop(e)}
        >
          {/* { this.renderDragView() } */}
          { this.renderFontFileView() }
        </View>
        <View style={styles.fontShowView}>         
          <View style={styles.fontShow}>
            <WebView
              style={styles.webView}
              scrollEnabled
              source={{html:html}}
            />
          </View> 
          <View style={styles.mapperView}>
          </View> 
        </View>                        
      </View>
    );
  }

  onFileSelected(index) {
    const file = this.state.files[index];
    this.loadFile(file);
  }

  onDeleteFileItem(index) {
    const files = this.state.files.filter((e, idx)=> idx !== index);
    this.setState({
      files: files
    });
    const isSelected = (this.state.selectedIndex === index);
  }

  onDrop(e) {
    console.log(e.nativeEvent);
    let files = e.nativeEvent.files;
    files = this.filteredTTFFiles(files);

    AsyncStorage.setItem(FileStorageKey, JSON.stringify(files));

    this.setState({
      files: files, 
      dragOver: false
    });

    const file = files[0];
    this.loadFile(file)    
  }

  filteredTTFFiles(files) {
    return files.filter(e => e.endsWith('.ttf'));
  }

  loadFile(file) {
    opentype.load(file, (err, font)=> {
      if (err) {
        console.warn(err);
        return;
      }
      console.log(font);
      this.parseFont(font);
    });  
  }

  parseFont(font) {
    const fontGlyphs = font.glyphs;
    let glyphs = []    
    for (let i = 0; i < fontGlyphs.length; i++) {
      let glyph = fontGlyphs.get(i);
      if (glyph.unicode) {
        let path = glyph.getPath(0,40,40);
        glyph.svg = path.toSVG();;
        glyphs.push(glyph); 
      }        
    }
    
    this.setState({
      glyphs: glyphs
    });
    console.log(glyphs);
  } 

  getGlyphHtml(glyph) {
    const { svg, name, unicode } = glyph;
    return (
      `<div class="glyph">
        <svg class="glyph_svg">          
          ${svg}
        </svg>
        <p> ${name} </p>
        <p> ${unicode}</p>
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
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    overflow: 'hidden'
  },
  headerView: {
    marginTop: 40,
    marginHorizontal: 20,
    flexDirection: 'row',
    backgroundColor: 'green',
    borderStyle: 'solid',
    borderWidth: 3,
    height: 150,
  },
  dragView: {
    padding: 10,
    width: 120,
   
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1
  },
  fontFileWrap: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'red'
  },
  fontFileContainerWrap: {
    flexDirection: 'row',   
  },
  fileItemWrap: {
    width: 100,
    marginRight: 15,
    marginTop: 5,
    marginBottom: 10
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
  fileItem: {
    marginTop: 10,
    marginRight: 10
  },  
  fileIconWrap: {
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    height: 100
  },
  fileIcon: {
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 15
  },
  fileNameWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  fileName: {
    fontSize: 15,
    color: '#333'
  },
  fontShowView: {
    flex: 1,
    marginVertical: 20,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'red'
  },
  fontShow: {
    flex: 1,
    marginLeft: 0,
    marginBottom: 0,
    marginTop: 0,
    flexGrow: 2,
    backgroundColor: '#0f0'
  },
  webView: {
    flex: 1,
    backgroundColor: '#000'
  },
  mapperView: {
    flexGrow: 1,
    marginLeft: 20,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#ff0'
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

const glyphWrapStyles = `
<style> 
  .glyph {
    padding: 20px;
    width: 33.333333%;
    border-bottom-style: solid;
    border-right-style: solid;
    border-right-width: 1px;
    border-bottom-width: 1px;
    border-color: lightgray;
    -webkit-box-sizing:border-box;
    border-width: 1px;    
    border-style: solid;      
  }    
  .glyph_svg {
    border:1px solid #cd0000;
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