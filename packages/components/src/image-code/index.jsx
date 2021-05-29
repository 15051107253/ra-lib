import React, {forwardRef, useImperativeHandle, useContext, useState, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import {Input, Spin} from 'antd';
import classNames from 'classnames';
import defaultErrorImage from './defaultErrorImage.png';
import ComponentContext from '../component-context';
import './style.less';

function ImageCode(props, ref) {
    const context = useContext(ComponentContext);
    let {
        className,
        prefixCls = context.prefixCls,
        src,
        placeholder,
        onChange,
        value,
        errorImage,
        imageWidth,
        ...others
    } = props;

    useImperativeHandle(ref, () => {
        return {
            refresh: handleClick,
        };
    });

    const imgRef = useRef(null);

    const [url, setUrl] = useState(errorImage);
    const [id, setId] = useState(null);
    const [code, setCode] = useState(undefined);
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        // 后端地址可直接作为src的情况
        if (typeof src === 'string') {
            setUrl(`${src}?t=${Date.now()}`);
        }

        // ajax请求之后两种情况，一种 [id, url] 一种 url
        if (typeof src === 'function') {
            setLoading(true);
            try {
                const result = await src();

                if (typeof result === 'string') setUrl(result || errorImage);

                if (Array.isArray(result)) {
                    setId(result[0]);
                    setUrl(result[1] || errorImage);
                }
            } finally {
                setLoading(false);
            }
        }
    }

    function handleChange(e) {
        const code = e.target.value;

        if (id) {
            onChange([id, code]);
        } else {
            onChange(code);
        }
    }

    function handleError() {
        setUrl(errorImage);
    }

    useEffect(() => {
        if (typeof value === 'string') setCode(value);

        if (Array.isArray(value)) {
            setCode(value[1]);
        }

    }, [value]);

    useEffect(() => {
        (async () => {
            await handleClick();
        })();
    }, []);

    prefixCls = `${prefixCls}-image-code`;
    const rootClass = classNames(prefixCls, className);
    const inputClass = `${prefixCls}-input`;
    const imgClass = `${prefixCls}-img`;

    return (
        <Spin spinning={loading} size="small">
            <div className={rootClass}>
                <Input
                    className={inputClass}
                    placeholder={placeholder}
                    value={code}
                    onChange={handleChange}
                    {...others}
                />
                <img
                    ref={imgRef}
                    className={imgClass}
                    style={{width: imageWidth}}
                    src={url}
                    alt="图片验证码"
                    onClick={handleClick}
                    onError={handleError}
                />
            </div>
        </Spin>
    );
}


ImageCode.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    onChange: PropTypes.func,
    // src: string类型时，直接作为图片的src input value 为 string
    //      func  类型时，返回值如果是string，直接作为图片src input value 为 string
    //                  返回值如果是[key, url]，数组第一个元素作为验证码id，第二个元素作为图片src input value 为 [key, code]
    src: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    placeholder: PropTypes.string,
    // 出错时站位图片
    errorImage: PropTypes.string,
    imageWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

ImageCode.defaultProps = {
    placeholder: '请输入图片验证码',
    errorImage: defaultErrorImage,
    imageWidth: 90,
};

export default forwardRef(ImageCode);

