using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Security;
using El_Salam_Warehouse.Application.Features.Accounts.AccountManagement.Commands.ChangePassword;
using El_Salam_Warehouse.Domain.Common.Results;
using FluentAssertions;
using Moq;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace El_Salam_Warehouse.UnitTests.Features.Accounts.AccountManagement.Commands.ChangePassword;

// اختبارات وحدة لـ ChangePasswordCommandHandler
public class ChangePasswordCommandHandlerTests
{
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly ChangePasswordCommandHandler _handler;

    public ChangePasswordCommandHandlerTests()
    {
        _passwordServiceMock = new Mock<IPasswordService>();
        _currentUserMock = new Mock<ICurrentUser>();
        _handler = new ChangePasswordCommandHandler(_passwordServiceMock.Object, _currentUserMock.Object);
    }

    // التحقق من نجاح تغيير كلمة المرور عند إدخال كلمة المرور الحالية الصحيحة
    [Fact]
    public async Task Handle_WhenPasswordIsValid_ShouldReturnSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var command = new ChangePasswordCommand("OldPass123!", "NewPass123!", "NewPass123!");

        _currentUserMock.Setup(u => u.UserId).Returns(userId);
        _passwordServiceMock
            .Setup(p => p.ChangePasswordAsync(userId, command.CurrentPassword, command.NewPassword, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
    }

    // التحقق من الفشل عند عدم وجود مستخدم مسجل دخوله
    [Fact]
    public async Task Handle_WhenUserNotAuthenticated_ShouldReturnFailure()
    {
        // Arrange
        var command = new ChangePasswordCommand("OldPass123!", "NewPass123!", "NewPass123!");
        _currentUserMock.Setup(u => u.UserId).Returns((Guid?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
    }
}
