import {useRef, useContext} from 'react';
import PropTypes from 'prop-types';
import {DownOutlined, LoadingOutlined, CheckCircleOutlined, MinusCircleOutlined} from '@ant-design/icons';
import {Popconfirm, Dropdown, Menu, Tooltip} from 'antd';
import classNames from 'classnames';
import ComponentContext from '../component-context';
import './style.less';

function Operator(props) {
    const context = useContext(ComponentContext);

    let {
        className,
        prefixCls = context.prefixCls,
        items,
        moreText,
        moreContentWidth,
        moreTrigger,
    } = props;

    prefixCls = `${prefixCls}-operator`;
    const rootClass = classNames(prefixCls, className);
    const dividerClass = `${prefixCls}-divider`;
    const labelClass = `${prefixCls}-label`;

    const labelRef = useRef([]);

    // 获取label
    function getLabel(options, i) {
        let {label, icon, loading, color, disabled} = options;

        if (loading) {
            const labelWidth = labelRef.current[i] ? labelRef.current[i].offsetWidth : 'auto';
            return <a className={labelClass} style={{display: 'inline-block', width: labelWidth, textAlign: 'center'}}><LoadingOutlined/></a>;
        }

        const labelStyle = {
            transition: 'all 1ms', // 解决拖拽表格，点击无效问题
        };

        if (color) labelStyle.color = color;

        if (icon) {
            label = <Tooltip placement="bottom" title={label}>{icon}</Tooltip>;
        }

        const cls = classNames(labelClass, {
            disabled,
        });

        return <a className={cls} style={labelStyle} ref={v => labelRef.current[i] = v}>{label}</a>;
    }

    /*
     * 如果含有confirm属性，即表明是Popconfirm，
     * confirm作为Popconfirm的props
     *
     * 其他元素同理
     * */
    function getConfirm(options, i) {
        let label = getLabel(options, i);
        const {confirm, withKey = true} = options;

        // 配合 alt command ctrl 键使用，不弹出提示
        if (withKey) {
            label = (
                <span onClick={(e) => {
                    e && e.stopPropagation();
                    if (e.altKey || e.metaKey || e.ctrlKey) {
                        e.stopPropagation();
                        e.preventDefault();

                        if (confirm && confirm.onConfirm) {
                            confirm.onConfirm(e);
                        }
                    }
                }}>
                    {label}
                </span>
            );
        }
        return (
            <Popconfirm okType="danger" {...confirm}>
                {label}
            </Popconfirm>
        );
    }

    function getStatusSwitch(opt, i) {
        const {statusSwitch, disabled = false} = opt;
        const {status} = statusSwitch;
        const props = {...statusSwitch};
        const icon = status ? <CheckCircleOutlined/> : <MinusCircleOutlined/>;
        const color = status ? 'green' : 'red';

        let label = getLabel({...opt, label: icon, color}, i);

        // 如果没有权限，不允许进行操作，只做展示
        if (disabled) return label;

        Reflect.deleteProperty(props, 'status');

        return (
            <Popconfirm {...props}>
                {label}
            </Popconfirm>
        );
    }

    function getText(options, i) {
        let label = getLabel(options, i);
        const {onClick} = options;

        return <span onClick={onClick}>{label}</span>;
    }


    function renderItem(opt, i) {
        const {
            confirm,
            statusSwitch,
            visible = true,
            disabled = false,
        } = opt;

        if (visible) {
            // 因为label特殊，getStatusSwitch 内部自己判断了是否可用
            if (disabled && statusSwitch) return getStatusSwitch(opt, i);

            if (disabled) {
                opt.color = '#ccc';
                return getLabel(opt, i);
            }

            if (confirm) return getConfirm(opt, i);

            if (statusSwitch) return getStatusSwitch(opt, i);

            return getText(opt, i);
        }
        return null;
    }


    let operators = [];
    let more = [];

    if (typeof moreTrigger === 'string') {
        moreTrigger = [moreTrigger];
    }

    items.forEach((opt, i) => {
        const {isMore} = opt;
        const item = renderItem(opt, i);

        if (item) {
            if (isMore) {
                more.push(item);
            } else {
                operators.push(item);
            }
        }
    });

    if (more && more.length) { // 更多
        const menu = (
            <Menu style={{width: moreContentWidth}}>
                {
                    more.map((item, index) => <Menu.Item key={item.label || index}>{item}</Menu.Item>)
                }
            </Menu>
        );
        operators.push(
            <Dropdown overlay={menu} trigger={moreTrigger}>
                <a className="operator-label">
                    {moreText}
                </a>
            </Dropdown>,
        );
    }

    const operatorsLength = operators.length;

    if (!operatorsLength) {
        return null;
    }


    return (
        <div className={rootClass}>
            {operators.map((v, i) => (
                <span key={v.label || `operator-${i}`}>
                    {v}
                    {operatorsLength === i + 1 ? '' : <span className={dividerClass}/>}
                </span>
            ))}
        </div>
    );
}

Operator.propTypes = {
    // 操作项
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.any.isRequired,
        icon: PropTypes.string,
        visible: PropTypes.bool,
        disabled: PropTypes.bool,
        color: PropTypes.string,
        loading: PropTypes.bool,
        isMore: PropTypes.bool,

        onClick: PropTypes.func,
        confirm: PropTypes.object,
        statusSwitch: PropTypes.object,
    })),
    // 更多标签文案
    moreText: PropTypes.any,
    // 更多标签宽度
    moreContentWidth: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    // 显示更多下拉菜单触发方式
    moreTrigger: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.array,
    ]),
};

Operator.defaultProps = {
    items: [],
    moreText: <span>更多<DownOutlined/></span>,
    moreContentWidth: 'auto',
    moreTrigger: 'click',
};

export default Operator;
