/*
 * @Author: ihongren 
 * https://github.com/iHongRen/iconfont 
 * Copyright © 2018 ihongren. All rights reserved.
 */

import React, { Component } from 'react';
import {
  Text,
  View,
  Linking,
  WebView,
  Clipboard,  
  ScrollView,
  StyleSheet,
  MenuManager,
  AsyncStorage,
  TouchableOpacity,
  ActivityIndicator,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
const { AppOpenFilesEmitter } = NativeModules;

import * as opentype from 'opentype.js';

const AppConfig = {
  name: 'iconfont',
  version: '1.0',
  docs: 'https://github.com/iHongRen/iconfont',
  issues: 'https://github.com/iHongRen/iconfont/issues'
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
      glyphsMapperCaches: {},
      copyButtonTitle: 'copy',
      parseErrorText: '',
      glyphCount: 0,
      loading: false,
      topExpand: true,
      rightExpand: true,
    }
  }

  componentDidMount() {
    this.addMenuItem();
    this.parseFileStorage();

    const openFilesEmitter = new NativeEventEmitter(AppOpenFilesEmitter);
    this.fileSubscription = openFilesEmitter.addListener(
    'ApplicationOpenFilenamesEvent',
    (files) => {
      console.log(files);
      if (this.state.loading) {
        this.openFilenames = files;
      } else {
        this.openFiles(files);
      }
    });
  }

  componentWillUnmount() {
    this.fileSubscription.remove();
  }

  addMenuItem() {
    const items = [{
      title: 'Docs',
      key: 'I',
      callback: () => { Linking.openURL(AppConfig.docs) }
    },{
      title: 'Issues',
      key: 'D',
      callback: () => { Linking.openURL(AppConfig.issues) }
    }];
    MenuManager.addSubmenu('Usage', items);
  }

  renderAppNameView() {
    return (
      <View style={styles.appNameWrap}>
        <ActivityIndicator
          animating={this.state.loading}
          style={{marginRight: 10}}
        />
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

  renderFileHeaderView() {
    const { dragOver, files } = this.state;
    const dragColor =  dragOver ? '#bbb' : '#fff';
    const fileHeight = files.length > 5 ? 165 : 150;
    return (
      <View style={[panelStyles.fileHeaderView, {borderColor: dragColor, height: fileHeight}]}
        draggedTypes={['NSFilenamesPboardType']}         
        onDragEnter={() => this.setState({dragOver: true})}
        onDragLeave={() => this.setState({dragOver: false})}
        onDrop={(e) => this.onDrop(e)}
      >
        { this.renderFontFileView() }
      </View>
    );
  }

  renderFontFileView() {
    const { files, dragOver, mouseOver } = this.state;
    const dragColor =  (dragOver || mouseOver) ? '#333' :  '#bbb';
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={ files.length > 5 }
        style={fileItemStyles.fontFileWrap}
        contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}} 
      >
        { files.map(file => this.renderFileItemView(file)) }
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

  renderFileItemView(file) {
    const isSelectedColor = (file === this.state.selectedFile) ? '#333' : '#bbb';
    return (
      <View key={file} style={fileItemStyles.fileItemWrap}>
        <TouchableOpacity activeOpacity={0.6} style={fileItemStyles.fileItem} onPress={() => this.onFileSelected(file)}>
          <View style={[fileItemStyles.fileIconWrap, {borderColor: isSelectedColor}]}>
            <Text style={{fontSize: 40,  color: isSelectedColor}}>𝐹</Text>
          </View>
          <View style={fileItemStyles.fileNameWrap}>
            <Text style={[fileItemStyles.fileName,{color: isSelectedColor}]} numberOfLines={1}>{file.split('/').pop()}</Text>
          </View>             
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.6} style={[fileItemStyles.fileClose, {backgroundColor: isSelectedColor}]} onPress={() => this.onDeleteFileItem(file)}>
          <Text style={fileItemStyles.fileCloseIcon}>✕</Text>
        </TouchableOpacity>                                         
      </View>
    );
  }

  renderPanelView() {
    return (
      <View style={{flex: 1}}>
        { this.state.topExpand && this.renderFileHeaderView() }
        { this.renderFontShowView() }
      </View>
    );
  }

  renderFontShowView() {
    const { glyphsHtml } = this.state;  
    return (     
      <View style={panelStyles.fontShowView}>         
        <View style={panelStyles.fontShow}>
          <WebView 
            source={{html: glyphsHtml}} 
            onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
          />
        </View> 
        { this.state.rightExpand && this.renderJsonMapperView() }          
      </View>
    );
  }

  renderJsonMapperView() {
    return (
      <View style={panelStyles.mapperView}>        
        <WebView
          source={{html: this.state.mapperHtml}} 
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
        />
      </View>
    );
  }  

  renderBottomView() {
    const isWarn = !!this.state.parseErrorText;
    if (isWarn) {
      return this.renderWarnView();
    } 

    const hasSelected = !!this.state.selectedFile;
    if (hasSelected) {
      const text = `${this.state.glyphCount} items`;
      return (
        <View style={bottomViewStyles.bottomView}>
          <View style={bottomViewStyles.contentView}>
            <View style={{flexDirection: 'row', marginRight: 5}}>
              { this.renderTopExpandButton() }
              { this.renderRightExpandButton() }
              <Text style={bottomViewStyles.bottomText}>{text}</Text>
            </View>
          </View> 
          { this.state.rightExpand && this.renderCopyView() }                 
        </View>
      );
    } 
    return <View />
  }

  renderTopExpandButton() {
    const color = this.state.topExpand ? '#555' : '#aaa';
    return (
      <TouchableOpacity
        style={[expandStyles.expandButton, {borderColor: color}]} 
        activeOpacity={0.7}
        onPress={()=> this.setState({ topExpand: !this.state.topExpand })}>
        <View style={[expandStyles.topEx ,{backgroundColor:color}]}></View>
      </TouchableOpacity>
    );
  }
  
  renderRightExpandButton() {
    const color = this.state.rightExpand ? '#555' : '#aaa';
    return (
      <TouchableOpacity
        style={[expandStyles.expandButton, {borderColor: color, alignItems: 'flex-end'}]} 
        activeOpacity={0.7}
        onPress={()=> this.setState({ rightExpand: !this.state.rightExpand },()=> this.reloadGlyphsHtml())}
        >        
        <View style={[expandStyles.rightEx, {backgroundColor:color}]}></View>
      </TouchableOpacity>
    );
  }
  
  renderWarnView() {
    return (
      <View style={bottomViewStyles.warnView}>         
        <Text style={bottomViewStyles.warnText} numberOfLines={1}>{this.state.parseErrorText}</Text>
      </View>
    );
  }

  renderCopyView() {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={() => this.onCopyMapper()}>
        <Text style={{color: '#333', fontSize: 12, marginTop: -2}}>{this.state.copyButtonTitle}</Text>
      </TouchableOpacity>
    );
  }

  render() {  
    return (
      <View style={styles.container}> 
        { this.renderAppNameView() }        
        { this.state.files.length === 0 ? this.renderDragView() : this.renderPanelView() }
        { this.renderBottomView() }
      </View>
    );
  }

  onCopyMapper() {   
    const glyphsMapper = this.state.glyphsMapperCaches[this.state.selectedFile];
    if (glyphsMapper) {
      const { mapper } = glyphsMapper;      
      let text = this.getMapperJsonText(mapper);
      Clipboard.setString(text);        
      this.setState({
        copyButtonTitle: ' ✓ '
      })
      
      setTimeout(() => {
        this.setState({
          copyButtonTitle: 'copy'
        })
      }, 1000);
    }
  }

  onShouldStartLoadWithRequest = (e) => {
    return false;
  };

  onFileSelected(file) {
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
    this.setState({ dragOver: false });

    let files = e.nativeEvent.files;
    this.openFiles(files);
  }

  filteredTTFFiles(files) {
    let oFiles = this.state.files;
    return files.filter(e => {
      return e.endsWith('.ttf') && !oFiles.includes(e);
    });
  }

  openFiles(files) {
    let filenames = this.filteredTTFFiles(files);

    if(filenames.length === 0) return;
    this.parseFile(filenames[0], [...this.state.files, ...filenames]);
  }

  parseFile(file, files) {
    this.setState({ loading: true });
    const glyphsMapper = this.state.glyphsMapperCaches[file];
    if (glyphsMapper) {
      const { glyphs, mapper } = glyphsMapper;
      this.loadFileGlyphs(file, files, glyphs, mapper);
      return;
    }

    opentype.load(file, (err, font) => {
      if (err) {
        // console.warn(err);      
        let error = err.message || err;
        this.setState({ parseErrorText: `${file} ${error}`});
        setTimeout(() => { 
          this.setState({ parseErrorText: '' }) 
        }, 10000);
        this.handleParsed();
        return;
      }
      const glyphs = this.getConfigGlyphs(font.glyphs);
      const hasNames = glyphs.some(e => !!(e.name));
      const mapper = hasNames ? this.parseMapper(glyphs) : this.getUnicodeHexs(glyphs);
      
      this.state.glyphsMapperCaches[file] = { glyphs, mapper };        
      this.loadFileGlyphs(file, files, glyphs, mapper);
      this.storageFiles(files);
    });  
  }

  handleParsed() {  
    this.setState({ loading: false });

    if (this.openFilenames) {
      const files = [...this.openFilenames];
      this.openFiles(files);
      this.openFilenames = nil;     
    }
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
    const mapperHtml = this.getMapperHtml(mapper);
    const glyphsHtml = this.getGlyphWrapperHtml(glyphs);
    this.setState({
      glyphsHtml: glyphsHtml,
      mapperHtml: mapperHtml,
      selectedFile: selectedFile,
      files: files,
      glyphCount: glyphs.length,
      parseErrorText: ''
    }, () => {
      this.handleParsed();
    });
  }

  reloadGlyphsHtml() {
    const glyphsMapper = this.state.glyphsMapperCaches[this.state.selectedFile];
    if (glyphsMapper && glyphsMapper.glyphs) {
      const glyphsHtml = this.getGlyphWrapperHtml(glyphsMapper.glyphs);
      this.setState({
        glyphsHtml: glyphsHtml
      });
    }
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

  getGlyphHtml(glyph, index, numberOfRow=3) {
    const { svg, name, hex } = glyph;
    const glyphTop = index < numberOfRow ? 'glyph-top' : '';
    const glyphLeft = index % numberOfRow === 0 ? 'glyph-left' : '';
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
    const numberOfRow = this.state.rightExpand ? 3 : 4;
    return (
      `<div class="warpper">
        ${glyphs.reduce((prev, cur, index) => prev + this.getGlyphHtml(cur, index, numberOfRow),'')}
      </div> 
      ${glyphWrapStyles(numberOfRow)}`
    );
  }

  getMapperHtml(mapper) {   
    let jsonText = this.getMapperJsonText(mapper);
    return `<pre class='mapper'>${this.syntaxHighlight(jsonText)}</pre>${JsonStyles}`;
  }

  getMapperJsonText(mapper) {
    let jsonText = JSON.stringify(mapper, null, 2);
    let text = '';
    if (Array.isArray(mapper)) {
      text = jsonText.replace(/ "/g, " \"\\u");
    } else {
      text = jsonText.replace(/: "/g, ": \"\\u");
    }
    return text;
  }

  syntaxHighlight(jsonText) {
    let text = jsonText.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const regx = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    return text.replace(regx, (match) => {
      let cls = 'number';
      if (/^"/.test(match)) {
        const isKey = /:$/.test(match); 
        match = match || '';       
        match = isKey ? match.replace(/\"/g,"").replace(/\-/g,"_").replace(/\_(\w)/g, (all, letter) => letter.toUpperCase())  : match;
        cls = isKey ? 'key' : 'string'; 
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
    this.state.loading = true;
    AsyncStorage.getItem('FileNameStorageKey').then(filesJson => {
      const files = JSON.parse(filesJson);
      if (Array.isArray(files) && files.length > 0) {
        this.parseFile(files[0], files);
      } else {
        this.handleParsed();
      }
    });
  }

  storageFiles(files) {
    AsyncStorage.setItem('FileNameStorageKey', JSON.stringify(files));
  }
}

const expandStyles = StyleSheet.create({
  expandButton: {
    borderStyle: 'solid',
    borderWidth: 2,
    width: 16,
    height: 14,
    marginRight: 3
  },
  topEx: {
    marginTop: 1,
    marginHorizontal: 1, 
    height: 2,
  },
  rightEx: {
    flex: 1,
    marginRight: 2,
    marginVertical: 1,
    width: 2
  }
});

const bottomBase = {
  paddingTop: 5, 
  paddingHorizontal: 15,  
  height: 25,
}

const bottomViewStyles = StyleSheet.create({
  bottomView: {
    ...bottomBase,
    backgroundColor: '#f3f3f3', 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  contentView: { flexDirection: 'row' },
  bottomText: { color: '#333', fontSize: 12, marginLeft: 10},
  warnView: { ...bottomBase, backgroundColor: '#f00' },
  warnText: { color: 'white', fontSize: 12 },
});

const fileItemStyles = StyleSheet.create({
  fontFileWrap: {
    flex: 1,
    marginHorizontal: 10,   
  },
  fileItemWrap: {
    width: 100,
    height: 130,
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
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  fontShowView: {
    flex: 1,
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
    flexDirection: 'row',
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

const glyphWrapStyles = (numberOfRow=3) => {
  const width = numberOfRow ? `${100 / numberOfRow}%` : '33.333333%';
  return (
    `<style> 
      .glyph {
        padding: 10px 15px 10px 15px;
        width: ${width};
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
    </style>`
  );
}

const JsonStyles = 
`<style>
  .mapper { padding: 5px; margin: 5px; }
  .string { color: green; }
  .number { color: darkorange; }
  .boolean { color: blue; }
  .null { color: magenta; }
  .key { color: #CD2626; }
</style>`;
