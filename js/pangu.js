/**
 * 盘古之白 - 中英文自动空格排版
 * 版本: 1.0.0
 * 功能: 自动在中文与英文、数字、符号之间添加空格
 * 使用方法: 引入此脚本后自动生效
 * ©mocabolka code with Yuanbao Deepseek
 */

(function() {
    'use strict';
    
    // 盘古之白核心处理函数
    function pangu(text) {
        if (typeof text !== 'string') return text;
        
        // 核心规则：中英文、数字、符号之间添加空格
        return text
            // 中文与英文/数字之间
            .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
            .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
            // 中文与@#$%&等符号之间
            .replace(/([\u4e00-\u9fa5])([@#$%&])/g, '$1 $2')
            .replace(/([@#$%&])([\u4e00-\u9fa5])/g, '$1 $2')
            // 处理连续空格
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // 判断元素是否应跳过处理
    function shouldSkipElement(element) {
        if (!element) return true;
        
        const skipTags = ['SCRIPT', 'STYLE', 'PRE', 'CODE', 'TEXTAREA', 'INPUT'];
        const skipClasses = ['skip-pangu', 'no-autospace'];
        const skipSelectors = ['.code', '.monospace', '.ascii', '.pangu-skip'];
        
        // 检查标签
        if (skipTags.includes(element.tagName)) return true;
        
        // 检查类名
        for (let className of skipClasses) {
            if (element.classList.contains(className)) return true;
        }
        
        // 检查选择器
        for (let selector of skipSelectors) {
            if (element.matches(selector)) return true;
        }
        
        return false;
    }
    
    // 处理单个文本节点
    function processTextNode(textNode) {
        if (!textNode || !textNode.nodeValue || textNode.nodeValue.trim() === '') {
            return;
        }
        
        // 检查父元素是否应跳过
        let parent = textNode.parentElement;
        while (parent) {
            if (shouldSkipElement(parent)) {
                return;
            }
            parent = parent.parentElement;
        }
        
        const original = textNode.nodeValue;
        const processed = pangu(original);
        
        if (original !== processed) {
            textNode.nodeValue = processed;
        }
    }
    
    // 处理元素及其子节点
    function processElement(element) {
        if (shouldSkipElement(element)) return;
        
        // 使用TreeWalker遍历所有文本节点
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // 跳过空文本节点
                    if (!node.nodeValue || node.nodeValue.trim() === '') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // 检查是否需要跳过
                    let parent = node.parentElement;
                    while (parent) {
                        if (shouldSkipElement(parent)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        parent = parent.parentElement;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        let textNode;
        const textNodes = [];
        
        while (textNode = walker.nextNode()) {
            textNodes.push(textNode);
        }
        
        // 批量处理文本节点
        textNodes.forEach(processTextNode);
    }
    
    // 初始化处理整个页面
    function initPangu() {
        console.log('盘古之白初始化...');
        
        // 初始处理
        processElement(document.body);
        
        // 使用MutationObserver监听DOM变化
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // 处理新增的节点
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            processElement(node);
                        } else if (node.nodeType === Node.TEXT_NODE) {
                            processTextNode(node);
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    // 处理文本内容变化
                    processTextNode(mutation.target);
                }
            });
        });
        
        // 开始观察
        observer.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true
        });
        
        // 暴露observer以便于控制
        window.panguObserver = observer;
        
        console.log('盘古之白已启用');
    }
    
    // 手动触发处理的API
    window.Pangu = {
        // 处理指定元素
        process: function(element) {
            if (element instanceof Element) {
                processElement(element);
            } else if (typeof element === 'string') {
                const el = document.querySelector(element);
                if (el) processElement(el);
            } else {
                processElement(document.body);
            }
        },
        
        // 处理文本
        spacing: function(text) {
            return pangu(text);
        },
        
        // 停止自动处理
        stop: function() {
            if (window.panguObserver) {
                window.panguObserver.disconnect();
                console.log('盘古之白已停止');
            }
        },
        
        // 重新开始自动处理
        start: function() {
            if (window.panguObserver) {
                window.panguObserver.disconnect();
            }
            initPangu();
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPangu);
    } else {
        // DOM已经加载完成
        setTimeout(initPangu, 100);
    }
    
})();
